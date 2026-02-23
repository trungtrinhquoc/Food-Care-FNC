import React from 'react';
import { Cookie, Info, Settings, BarChart, Bell, ShieldCheck } from 'lucide-react';

const CookiePolicyPage: React.FC = () => {
    return (
        <div className="bg-white min-h-screen py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4 text-emerald-600">
                        <Cookie className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Chính Sách Cookies</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Chúng tôi sử dụng cookie để đảm bảo bạn có trải nghiệm tốt nhất trên website Food & Care.
                    </p>
                </div>

                <div className="space-y-10">
                    <section className="bg-slate-50 p-8 rounded-3xl">
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-4">
                            <Info className="w-6 h-6 text-emerald-600" />
                            1. Cookie là gì?
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            Cookie là các tệp văn bản nhỏ được lưu trữ trên máy tính hoặc thiết bị di động của bạn khi bạn truy cập một trang web. Chúng giúp website ghi nhớ thông tin về hoạt động và các tùy chọn cá nhân của bạn (như tên đăng nhập, ngôn ngữ, giỏ hàng...) trong một khoảng thời gian, để bạn không phải nhập lại mỗi khi quay lại hoặc chuyển từ trang này sang trang khác.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 px-4">2. Chúng tôi sử dụng Cookie như thế nào?</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="p-6 bg-white border border-emerald-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <ShieldCheck className="w-8 h-8 text-emerald-600 mb-4" />
                                <h3 className="font-bold text-slate-900 mb-2">Cookie thiết yếu</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">Bắt buộc để website hoạt động ổn định, cho phép bạn đăng nhập bảo mật và duy trì giỏ hàng mua sắm.</p>
                            </div>
                            <div className="p-6 bg-white border border-emerald-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <Settings className="w-8 h-8 text-emerald-600 mb-4" />
                                <h3 className="font-bold text-slate-900 mb-2">Cookie tùy chọn</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">Ghi nhớ các lựa chọn của bạn như địa chỉ giao hàng ưu tiên hoặc ngôn ngữ để cá nhân hóa dịch vụ.</p>
                            </div>
                            <div className="p-6 bg-white border border-emerald-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <BarChart className="w-8 h-8 text-emerald-600 mb-4" />
                                <h3 className="font-bold text-slate-900 mb-2">Cookie hiệu suất</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">Giúp chúng tôi hiểu cách người dùng tương tác với trang web, từ đó cải tiến giao diện và tính năng dựa trên dữ liệu thực tế.</p>
                            </div>
                            <div className="p-6 bg-white border border-emerald-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <Bell className="w-8 h-8 text-emerald-600 mb-4" />
                                <h3 className="font-bold text-slate-900 mb-2">Cookie quảng cáo</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">Hiển thị các thông tin khuyến mãi và gợi ý sản phẩm phù hợp nhất với nhu cầu mua sắm thường xuyên của bạn.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-emerald-600 text-white p-8 rounded-3xl">
                        <h2 className="text-2xl font-bold mb-4">3. Kiểm soát Cookie</h2>
                        <p className="mb-6 opacity-90">
                            Hầu hết các trình duyệt cho phép bạn từ chối hoặc xóa cookie thông qua cài đặt trình duyệt. Tuy nhiên, nếu bạn chặn tất cả cookie, một số tính năng của website (như thanh thanh toán hoặc tự động đăng nhập đơn hàng định kỳ) có thể không hoạt động chính xác.
                        </p>
                        <div className="flex gap-4">
                            <button className="px-5 py-2.5 bg-white text-emerald-600 rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-50 transition-colors">
                                Cài đặt trình duyệt
                            </button>
                        </div>
                    </section>

                    <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 text-sm">
                            Bằng cách tiếp tục sử dụng dịch vụ của Food & Care, bạn đồng ý với việc sử dụng cookie theo chính sách này.
                        </p>
                        <p className="text-slate-400 text-xs mt-4 uppercase tracking-widest font-bold">
                            Cập nhật lần cuối: 26/01/2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicyPage;
