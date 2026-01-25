import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    getSubscriptionConfirmation,
    processSubscriptionConfirmation,
    type SubscriptionConfirmationDetails
} from '../services/subscriptionReminderApi';

export default function SubscriptionConfirmPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const defaultAction = searchParams.get('action') as 'continue' | 'pause' | 'cancel' | null;

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [details, setDetails] = useState<SubscriptionConfirmationDetails | null>(null);
    const [selectedAction, setSelectedAction] = useState<'continue' | 'pause' | 'cancel' | null>(defaultAction);
    const [pauseUntil, setPauseUntil] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Token không hợp lệ');
            setLoading(false);
            return;
        }

        loadConfirmationDetails();
    }, [token]);

    const loadConfirmationDetails = async () => {
        try {
            setLoading(true);
            const response = await getSubscriptionConfirmation(token!);

            if (response.success) {
                setDetails(response.data);

                if (response.data.isExpired) {
                    setError('Link xác nhận đã hết hạn');
                } else if (response.data.isAlreadyProcessed) {
                    setError('Link này đã được sử dụng');
                }
            } else {
                setError(response.message || 'Không thể tải thông tin');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedAction) {
            setError('Vui lòng chọn một hành động');
            return;
        }

        if (selectedAction === 'pause' && !pauseUntil) {
            setError('Vui lòng chọn ngày tạm dừng');
            return;
        }

        try {
            setProcessing(true);
            setError(null);

            const response = await processSubscriptionConfirmation({
                token: token!,
                action: selectedAction,
                pauseUntil: selectedAction === 'pause' ? pauseUntil : undefined
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                setError(response.message || 'Không thể xử lý yêu cầu');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Thành công!</h2>
                    <p className="text-gray-600 mb-4">Yêu cầu của bạn đã được xử lý thành công.</p>
                    <p className="text-sm text-gray-500">Đang chuyển về trang chủ...</p>
                </div>
            </div>
        );
    }

    if (error || !details) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Xác nhận đơn hàng định kỳ</h1>
                    <p className="text-gray-600">Vui lòng xác nhận bạn có muốn tiếp tục nhận đơn hàng này không</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-start gap-4 mb-6">
                        {details.productImage && (
                            <img
                                src={details.productImage}
                                alt={details.productName}
                                className="w-24 h-24 object-cover rounded-lg"
                            />
                        )}
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{details.productName}</h2>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-semibold">Ngày giao:</span> {new Date(details.scheduledDeliveryDate).toLocaleDateString('vi-VN')}</p>
                                <p><span className="font-semibold">Tần suất:</span> {details.frequency}</p>
                                <p><span className="font-semibold">Số lượng:</span> {details.quantity}</p>
                                <p className="text-lg font-bold text-emerald-600 mt-2">
                                    {details.totalAmount.toLocaleString('vi-VN')}đ
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Chọn hành động:</h3>

                        <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${selectedAction === 'continue' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
                            }`}>
                            <input
                                type="radio"
                                name="action"
                                value="continue"
                                checked={selectedAction === 'continue'}
                                onChange={() => setSelectedAction('continue')}
                                className="mr-3"
                            />
                            <span className="font-semibold text-gray-900">✅ Tiếp tục đặt hàng</span>
                            <p className="text-sm text-gray-600 ml-6">Đơn hàng sẽ được giao như bình thường</p>
                        </label>

                        <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${selectedAction === 'pause' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300'
                            }`}>
                            <input
                                type="radio"
                                name="action"
                                value="pause"
                                checked={selectedAction === 'pause'}
                                onChange={() => setSelectedAction('pause')}
                                className="mr-3"
                            />
                            <span className="font-semibold text-gray-900">⏸️ Tạm dừng</span>
                            <p className="text-sm text-gray-600 ml-6 mb-2">Tạm dừng đến một ngày cụ thể</p>
                            {selectedAction === 'pause' && (
                                <input
                                    type="date"
                                    value={pauseUntil}
                                    onChange={(e) => setPauseUntil(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="ml-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            )}
                        </label>

                        <label className={`block p-4 border-2 rounded-lg cursor-pointer transition ${selectedAction === 'cancel' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                            }`}>
                            <input
                                type="radio"
                                name="action"
                                value="cancel"
                                checked={selectedAction === 'cancel'}
                                onChange={() => setSelectedAction('cancel')}
                                className="mr-3"
                            />
                            <span className="font-semibold text-gray-900">❌ Hủy đăng ký</span>
                            <p className="text-sm text-gray-600 ml-6">Hủy hoàn toàn đơn hàng định kỳ này</p>
                        </label>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!selectedAction || processing}
                        className="w-full mt-6 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                        {processing ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-semibold mb-1">ℹ️ Lưu ý:</p>
                    <p>Nếu bạn không thực hiện hành động nào, đơn hàng sẽ tự động được tạo và giao đến bạn vào ngày dự kiến.</p>
                </div>
            </div>
        </div>
    );
}
