import React from 'react';
import { FileText, UserCheck, RefreshCw, CreditCard, HelpCircle, AlertCircle } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
    return (
        <div className="bg-white min-h-screen py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4 text-emerald-600">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Điều Khoản Dịch Vụ</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ của Food & Care.
                    </p>
                </div>

                <div className="space-y-12">
                    <section>
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 border-b border-emerald-100 pb-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-lg text-sm">1</span>
                            Mô tả dịch vụ
                        </h2>
                        <div className="bg-slate-50 p-6 rounded-2xl text-slate-600 space-y-4">
                            <p>
                                <strong>Food & Care</strong> là nền tảng thương mại điện tử chuyên cung cấp các sản phẩm thiết yếu với mô hình giao hàng định kỳ (Subscription).
                            </p>
                            <p>
                                Mục tiêu của chúng tôi là giúp khách hàng tối ưu hóa việc mua sắm, đảm bảo luôn có đủ hàng hóa cần thiết mà không cần phải đặt hàng thủ công nhiều lần.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 border-b border-emerald-100 pb-2">
                            <span className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white rounded-lg text-sm">2</span>
                            Tài khoản người dùng
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex gap-4">
                                <UserCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Thông tin chính xác</h3>
                                    <p className="text-sm text-slate-500">Người dùng cam kết cung cấp thông tin đúng và chịu trách nhiệm về tính xác thực.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <AlertCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-1">Bảo mật tài khoản</h3>
                                    <p className="text-sm text-slate-500">Bạn có trách nhiệm bảo mật mật khẩu và thông báo ngay nếu phát hiện truy cập trái phép.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100">
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6">
                            <RefreshCw className="w-6 h-6 text-emerald-600" />
                            3. Đơn hàng định kỳ (Subscription)
                        </h2>
                        <ul className="space-y-4 text-slate-600">
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span><strong>Tần suất:</strong> Bạn có thể chọn giao hàng hàng tuần hoặc hàng tháng cho từng sản phẩm.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span><strong>Linh hoạt:</strong> Bạn có thể sửa đổi danh sách sản phẩm hoặc ngày nhận hàng bất cứ lúc nào trước khi đơn hàng được chuẩn bị 24 giờ.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <span><strong>Ưu đãi:</strong> Khách hàng đăng ký định kỳ sẽ nhận được ưu đãi từ 10-15% so với giá mua lẻ thông thường.</span>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-6 border-b border-emerald-100 pb-2">
                            <CreditCard className="w-6 h-6 text-emerald-600" />
                            4. Thanh toán
                        </h2>
                        <p className="text-slate-600 mb-4">
                            Chúng tôi hỗ trợ các phương thức thanh toán an toàn thông qua các đối tác uy tín:
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {['Ví điện tử', 'Thẻ nội địa & quốc tế', 'PayOS', 'Chuyển khoản'].map((item) => (
                                <span key={item} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section className="bg-slate-900 text-white p-8 rounded-3xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <HelpCircle className="w-24 h-24" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">5. Chính sách đổi trả</h2>
                        <p className="text-slate-300 leading-relaxed mb-6">
                            Để đảm bảo quyền lợi khách hàng, Food & Care áp dụng chính sách đổi trả trong 24 giờ kể từ khi nhận hàng cho các trường hợp:
                        </p>
                        <ul className="grid md:grid-cols-2 gap-4 text-sm">
                            <li className="bg-white/10 p-3 rounded-xl border border-white/10">Sản phẩm bị hư hỏng do vận chuyển</li>
                            <li className="bg-white/10 p-3 rounded-xl border border-white/10">Sản phẩm không đúng chủng loại, mẫu mã</li>
                            <li className="bg-white/10 p-3 rounded-xl border border-white/10">Sản phẩm đã hết hạn sử dụng</li>
                            <li className="bg-white/10 p-3 rounded-xl border border-white/10">Sản phẩm bị lỗi từ nhà sản xuất</li>
                        </ul>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
                    <p className="mb-2">© 2026 Food & Care. Mọi quyền được bảo lưu.</p>
                    <p>Việc sử dụng dịch vụ của chúng tôi đồng nghĩa với việc bạn đã đồng ý với các điều khoản này.</p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;
