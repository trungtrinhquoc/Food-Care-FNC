import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, Package, Home, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function PaymentSuccessPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { clearSelectedItems } = useCart();

    useEffect(() => {
        // Clear cart when payment is successful
        clearSelectedItems();
    }, []);

    const orderId = searchParams.get('orderId') || 'Đang xử lý';

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-lg overflow-hidden border-none shadow-2xl relative">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

                <CardHeader className="pt-10 pb-6 text-center">
                    <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-bounce-slow">
                        <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">Thanh toán thành công!</CardTitle>
                    <p className="text-gray-500 mt-2 font-medium">Cảm ơn bạn đã tin tưởng lựa chọn Food & Care</p>
                </CardHeader>

                <CardContent className="space-y-8 px-8 pb-10">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <div className="text-sm text-gray-500 font-medium">Mã đơn hàng:</div>
                            <div className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">{orderId}</div>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <div className="text-sm text-gray-500 font-medium">Trạng thái:</div>
                            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                Đã hoàn tất thanh toán
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <p className="text-sm text-center text-gray-500 leading-relaxed italic">
                            * Hệ thống đang xử lý đơn hàng của bạn. Bạn sẽ nhận được thông báo khi đơn hàng được giao cho đơn vị vận chuyển.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-12 rounded-xl font-bold border-2 hover:bg-gray-50"
                                onClick={() => navigate('/')}
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Về trang chủ
                            </Button>
                            <Button
                                className="h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                onClick={() => navigate('/profile')}
                            >
                                <Package className="w-4 h-4 mr-2" />
                                Xem đơn hàng
                                <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
