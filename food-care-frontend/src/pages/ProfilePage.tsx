import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Thông tin cá nhân</h1>

            <div className="card space-y-4">
                <div>
                    <label className="text-sm text-gray-600">Họ tên</label>
                    <p className="font-semibold">{user?.fullName}</p>
                </div>

                <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-semibold">{user?.email}</p>
                </div>

                <div>
                    <label className="text-sm text-gray-600">Số điện thoại</label>
                    <p className="font-semibold">{user?.phoneNumber || 'Chưa cập nhật'}</p>
                </div>

                <div>
                    <label className="text-sm text-gray-600">Hạng thành viên</label>
                    <p className="font-semibold text-primary">{user?.memberTier?.name}</p>
                </div>

                <div>
                    <label className="text-sm text-gray-600">Điểm tích lũy</label>
                    <p className="font-semibold">{user?.loyaltyPoints.toLocaleString('vi-VN')}</p>
                </div>

                <div>
                    <label className="text-sm text-gray-600">Tổng chi tiêu</label>
                    <p className="font-semibold">{user?.totalSpent?.toLocaleString('vi-VN') ?? 0}đ</p>
                </div>
            </div>
        </div>
    );
}
