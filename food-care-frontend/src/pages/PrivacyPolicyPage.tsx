import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="bg-white min-h-screen py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-4 text-emerald-600">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Chính Sách Bảo Mật</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Food & Care cam kết bảo vệ thông tin cá nhân và quyền riêng tư của khách hàng.
                    </p>
                </div>

                <div className="prose prose-slate max-w-none">
                    <section className="mb-10 bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100">
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-4">
                            <FileText className="w-6 h-6 text-emerald-600" />
                            1. Thu thập thông tin
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, thực hiện đơn hàng, hoặc đăng ký nhận tin nhắn từ chúng tôi. Thông tin thu thập bao gồm:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-600">
                            <li>Họ tên, địa chỉ email, và số điện thoại liên lạc.</li>
                            <li>Địa chỉ giao hàng để thực hiện các đơn hàng định kỳ.</li>
                            <li>Thông tin thanh toán (được mã hóa và xử lý bảo mật bởi đối tác thanh toán).</li>
                            <li>Lịch sử mua hàng và các sản phẩm bạn quan tâm.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-4">
                            <Eye className="w-6 h-6 text-emerald-600" />
                            2. Sử dụng thông tin
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            Chúng tôi sử dụng thông tin của bạn cho các mục đích sau:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <h3 className="font-bold mb-2">Xử lý dịch vụ</h3>
                                <p className="text-sm text-slate-500">Thực hiện đơn hàng, giao hàng đúng lịch hẹn và quản lý tài khoản.</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <h3 className="font-bold mb-2">Cải thiện trải nghiệm</h3>
                                <p className="text-sm text-slate-500">Phân tích nhu cầu để cá nhân hóa gợi ý sản phẩm phù hợp với bạn.</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <h3 className="font-bold mb-2">Gửi thông báo</h3>
                                <p className="text-sm text-slate-500">Cập nhật tình trạng đơn hàng và các chương trình ưu đãi mới nhất.</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <h3 className="font-bold mb-2">Hỗ trợ khách hàng</h3>
                                <p className="text-sm text-slate-500">Giải đáp thắc mắc và xử lý các vấn đề phát sinh nhanh chóng.</p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-10 bg-slate-50 p-8 rounded-2xl border border-slate-100">
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900 mb-4">
                            <Lock className="w-6 h-6 text-emerald-600" />
                            3. Bảo mật thông tin
                        </h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            An toàn dữ liệu của bạn là ưu tiên hàng đầu của chúng tôi:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li>Chúng tôi sử dụng công nghệ mã hóa SSL để bảo vệ thông tin truyền tải.</li>
                            <li>Dữ liệu được lưu trữ trên hệ thống máy chủ bảo mật với sự giám sát 24/7.</li>
                            <li>Chúng tôi <strong>không bao giờ</strong> bán hoặc trao đổi dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích thương mại.</li>
                            <li>Chỉ những nhân viên có thẩm quyền mới được tiếp cận thông tin cần thiết để thực hiện công việc.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Quyền lợi của khách hàng</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Bạn hoàn toàn có quyền kiểm soát thông tin cá nhân của mình:
                        </p>
                        <ul className="list-decimal pl-6 mt-4 space-y-2 text-slate-600 font-medium">
                            <li>Quyền truy cập và cập nhật thông tin trong phần "Hồ sơ cá nhân".</li>
                            <li>Quyền yêu cầu xóa bỏ tài khoản và các dữ liệu liên quan.</li>
                            <li>Quyền từ chối nhận thông tin quảng cáo qua email bất cứ lúc nào.</li>
                            <li>Quyền khiếu nại nếu phát hiện thông tin bị sử dụng sai mục đích.</li>
                        </ul>
                    </section>

                    <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 italic mb-4">Chính sách này có hiệu lực từ ngày 01/01/2026</p>
                        <div className="flex justify-center gap-6">
                            <span className="text-sm text-slate-400">Email: support@foodcare.com</span>
                            <span className="text-sm text-slate-400">Hotline: 0865 498 733</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
