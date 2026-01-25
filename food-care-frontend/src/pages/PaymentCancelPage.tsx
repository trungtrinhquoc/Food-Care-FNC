import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

export default function PaymentCancelPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-sans">
            <Card className="w-full max-w-lg overflow-hidden border-none shadow-2xl relative">
                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-orange-500" />

                <CardHeader className="pt-10 pb-6 text-center">
                    <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-gray-900 tracking-tight">Thanh toán thất bại</CardTitle>
                    <p className="text-gray-500 mt-2 font-medium">Đã có lỗi xảy ra hoặc bạn đã hủy giao dịch.</p>
                </CardHeader>

                <CardContent className="space-y-8 px-8 pb-10">
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 space-y-3">
                            <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4" />
                                Có thể do:
                            </h3>
                            <ul className="text-sm text-red-700/80 space-y-2 pl-6 list-disc font-medium">
                                <li>Quá trình thanh toán bị gián đoạn</li>
                                <li>Số dư tài khoản không đủ</li>
                                <li>Thông tin thẻ/tài khoản chưa chính xác</li>
                                <li>Cổng thanh toán đang bảo trì</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <Button
                                variant="outline"
                                className="h-12 rounded-xl font-bold border-2 hover:bg-gray-50 text-gray-700"
                                onClick={() => navigate('/cart')}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Quay lại giỏ hàng
                            </Button>
                            <Button
                                className="h-12 rounded-xl font-bold bg-gray-900 hover:bg-black text-white shadow-lg transition-transform active:scale-95"
                                onClick={() => navigate('/checkout')}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Thử thanh toán lại
                            </Button>
                        </div>

                        <p className="text-sm text-center text-gray-400 font-medium italic mt-6">
                            Nếu bạn gặp vấn đề kỹ thuật, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
