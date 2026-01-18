import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, register, loginWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const [loginData, setLoginData] = useState({
        email: '',
        password: '',
    });

    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await login({ email: loginData.email, password: loginData.password });
            toast.success('Đăng nhập thành công!');
            
            // Redirect based on user role
            const userRole = response?.user?.role?.toLowerCase();
            if (userRole === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
            toast.error(errorMessage);
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (registerData.password !== registerData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (registerData.password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);

        try {
            await register({
                email: registerData.email,
                password: registerData.password,
                fullName: registerData.name,
                phoneNumber: '' // Phone number is optional in this UI, can be improved later
            });
            toast.success('Đăng ký thành công!');
            navigate('/');
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            toast.error(errorMessage);
            console.error('Registration error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await loginWithGoogle();
            toast.success('Đăng nhập bằng Google thành công!');
            navigate('/');
        } catch (error) {
            toast.error('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
        } finally {
            setIsGoogleLoading(false);
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

                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 p-1 rounded-xl">
                        <TabsTrigger
                            value="login"
                            className="rounded-lg font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all duration-200"
                        >
                            Đăng nhập
                        </TabsTrigger>
                        <TabsTrigger
                            value="register"
                            className="rounded-lg font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all duration-200"
                        >
                            Đăng ký
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-center text-gray-800">Đăng nhập</CardTitle>
                                <CardDescription className="text-center">
                                    Đăng nhập để tiếp tục mua sắm
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="example@email.com"
                                            value={loginData.email}
                                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                            required
                                            className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Mật khẩu</Label>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={loginData.password}
                                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                            required
                                            className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-sm text-gray-600">
                                            <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                            Ghi nhớ đăng nhập
                                        </label>
                                        <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
                                            Quên mật khẩu?
                                        </button>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                    </Button>

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-white text-gray-500">Hoặc tiếp tục với</span>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium h-11 rounded-xl transition-all shadow-sm"
                                        onClick={handleGoogleLogin}
                                        disabled={isGoogleLoading}
                                    >
                                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        {isGoogleLoading ? 'Đang đăng nhập...' : 'Đăng nhập bằng Google'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="register">
                        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-center text-gray-800">Đăng ký</CardTitle>
                                <CardDescription className="text-center">
                                    Tạo tài khoản mới để bắt đầu
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="register-name">Họ và tên</Label>
                                        <Input
                                            id="register-name"
                                            type="text"
                                            placeholder="Nguyễn Văn A"
                                            value={registerData.name}
                                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                            required
                                            className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-email">Email</Label>
                                        <Input
                                            id="register-email"
                                            type="email"
                                            placeholder="example@email.com"
                                            value={registerData.email}
                                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                            required
                                            className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-password">Mật khẩu</Label>
                                        <Input
                                            id="register-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={registerData.password}
                                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                            required
                                            className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-confirm-password">Xác nhận mật khẩu</Label>
                                        <Input
                                            id="register-confirm-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={registerData.confirmPassword}
                                            onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                            required
                                            className="bg-white/50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        />
                                    </div>
                                    <div className="text-xs text-center text-gray-500 mt-4">
                                        Bằng việc đăng ký, bạn đồng ý với{' '}
                                        <button type="button" className="text-emerald-600 hover:underline font-medium">
                                            Điều khoản dịch vụ
                                        </button>{' '}
                                        và{' '}
                                        <button type="button" className="text-emerald-600 hover:underline font-medium">
                                            Chính sách bảo mật
                                        </button>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
                                    </Button>

                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-white text-gray-500">Hoặc tiếp tục với</span>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium h-11 rounded-xl transition-all shadow-sm"
                                        onClick={handleGoogleLogin}
                                        disabled={isGoogleLoading}
                                    >
                                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        {isGoogleLoading ? 'Đang đăng ký...' : 'Đăng ký bằng Google'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-600 hover:text-emerald-600 text-sm font-medium transition-colors hover:underline"
                    >
                        ← Quay lại trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
}
