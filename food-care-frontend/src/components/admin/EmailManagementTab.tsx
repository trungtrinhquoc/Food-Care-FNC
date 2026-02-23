import { Mail, Send, Info } from 'lucide-react';

export default function EmailManagementTab() {
    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Quản Lý Email</h2>
                <p className="text-sm text-gray-600">Gửi email nhắc nhở thủ công cho subscriptions</p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-2">Hướng dẫn sử dụng:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Vào tab <strong>Danh Sách</strong> để chọn các subscriptions cần gửi email</li>
                            <li>Tích chọn các subscription (chỉ subscription đang hoạt động mới có thể chọn)</li>
                            <li>Nhấn nút <strong>Gửi Email</strong> để gửi email nhắc nhở hàng loạt</li>
                            <li>Hoặc xem chi tiết từng subscription và gửi email riêng lẻ</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Gửi Email Hàng Loạt</h3>
                            <p className="text-sm text-gray-600">Chọn nhiều subscription cùng lúc</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                        Vào tab Danh Sách, tích chọn các subscription và nhấn nút "Gửi Email" ở góc trên bên phải.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Send className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Gửi Email Riêng Lẻ</h3>
                            <p className="text-sm text-gray-600">Gửi cho từng subscription</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                        Nhấn vào icon mắt để xem chi tiết subscription, sau đó nhấn nút "Gửi Email Nhắc Nhở".
                    </p>
                </div>
            </div>

            {/* Email Template Preview */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Mẫu Email Nhắc Nhở</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm space-y-2">
                        <div className="font-semibold text-gray-900">Tiêu đề: Nhắc nhở giao hàng định kỳ - Food & Care</div>
                        <div className="text-gray-700 mt-4">
                            <p>Xin chào [Tên khách hàng],</p>
                            <p className="mt-2">
                                Đơn hàng định kỳ của bạn cho sản phẩm <strong>[Tên sản phẩm]</strong> sẽ được giao vào ngày <strong>[Ngày giao]</strong>.
                            </p>
                            <p className="mt-2">Vui lòng xác nhận:</p>
                            <ul className="list-disc list-inside ml-4 mt-2">
                                <li>✅ Tiếp tục giao hàng</li>
                                <li>⏸️ Tạm dừng đến ngày khác</li>
                                <li>❌ Hủy đơn hàng định kỳ</li>
                            </ul>
                            <p className="mt-4">Trân trọng,<br />Food & Care Team</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
