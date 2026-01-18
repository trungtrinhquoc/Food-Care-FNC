# Frontend Integration Complete - Profile Management

## ✅ Hoàn thành

Đã tạo xong API service layer cho Profile Management!

---

## 📁 Files Created/Updated

### 1. API Service (`src/services/api.ts`)
**Updated**: Đã thêm `profileApi` với 14 methods

#### Profile Management (2 methods)
- `updateProfile(data)` - Cập nhật thông tin cá nhân
- `changePassword(data)` - Đổi mật khẩu

#### Address Management (6 methods)
- `getAddresses()` - Lấy danh sách địa chỉ
- `getAddress(addressId)` - Lấy chi tiết địa chỉ
- `createAddress(data)` - Tạo địa chỉ mới
- `updateAddress(addressId, data)` - Cập nhật địa chỉ
- `deleteAddress(addressId)` - Xóa địa chỉ
- `setDefaultAddress(addressId)` - Đặt địa chỉ mặc định

#### Payment Method Management (6 methods)
- `getPaymentMethods()` - Lấy danh sách phương thức thanh toán
- `getPaymentMethod(paymentMethodId)` - Lấy chi tiết phương thức
- `createPaymentMethod(data)` - Tạo phương thức mới
- `updatePaymentMethod(paymentMethodId, data)` - Cập nhật phương thức
- `deletePaymentMethod(paymentMethodId)` - Xóa phương thức
- `setDefaultPaymentMethod(paymentMethodId)` - Đặt phương thức mặc định

### 2. Types (`src/types/index.ts`)
**Already has**:
- `Address` interface
- `PaymentMethod` interface
- `PaymentMethodType` type

---

## 🎯 Next Steps - Update ProfilePage

Bây giờ bạn cần update `ProfilePage.tsx` để sử dụng real API thay vì mock data.

### Các thay đổi cần thiết:

#### 1. Import profileApi
```typescript
import { profileApi } from '../services/api';
import { toast } from 'sonner';
```

#### 2. Replace Mock Data với API Calls

**Load Addresses:**
```typescript
useEffect(() => {
    const loadAddresses = async () => {
        try {
            const data = await profileApi.getAddresses();
            setAddresses(data);
        } catch (error) {
            toast.error('Không thể tải địa chỉ');
        }
    };
    loadAddresses();
}, []);
```

**Load Payment Methods:**
```typescript
useEffect(() => {
    const loadPaymentMethods = async () => {
        try {
            const data = await profileApi.getPaymentMethods();
            setPaymentMethods(data);
        } catch (error) {
            toast.error('Không thể tải phương thức thanh toán');
        }
    };
    loadPaymentMethods();
}, []);
```

#### 3. Add Form Handlers

**Update Profile:**
```typescript
const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await profileApi.updateProfile({
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            avatarUrl: formData.avatarUrl,
        });
        
        toast.success('Cập nhật thông tin thành công!');
        // Reload user data
        const updatedUser = await authApi.getCurrentUser();
        // Update user in context
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
        setLoading(false);
    }
};
```

**Change Password:**
```typescript
const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        await profileApi.changePassword({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
            confirmPassword: passwordData.confirmPassword,
        });
        
        toast.success('Đổi mật khẩu thành công!');
        // Clear form
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
        setLoading(false);
    }
};
```

**Create Address:**
```typescript
const handleCreateAddress = async (data: Omit<Address, 'id'>) => {
    setLoading(true);
    
    try {
        const newAddress = await profileApi.createAddress(data);
        setAddresses([...addresses, newAddress]);
        toast.success('Thêm địa chỉ thành công!');
        setShowAddressModal(false);
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
        setLoading(false);
    }
};
```

**Delete Address:**
```typescript
const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    setLoading(true);
    
    try {
        await profileApi.deleteAddress(addressId);
        setAddresses(addresses.filter(a => a.id !== addressId));
        toast.success('Xóa địa chỉ thành công!');
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể xóa địa chỉ mặc định');
    } finally {
        setLoading(false);
    }
};
```

#### 4. Add Loading States

```typescript
const [loading, setLoading] = useState(false);
const [loadingAddresses, setLoadingAddresses] = useState(true);
const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
```

#### 5. Add Form State Management

```typescript
const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    avatarUrl: user?.avatarUrl || '',
});

const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
});
```

---

## 🎨 UI Enhancements Needed

### 1. Add Loading Spinners
```typescript
{loading && <div className="spinner">Loading...</div>}
```

### 2. Add Confirmation Dialogs
Sử dụng một dialog component hoặc `window.confirm()` cho delete actions

### 3. Add Form Validation
```typescript
const validateForm = () => {
    if (!formData.fullName) {
        toast.error('Họ tên không được để trống');
        return false;
    }
    // More validations...
    return true;
};
```

### 4. Add Error Handling
```typescript
try {
    // API call
} catch (error: any) {
    if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn');
        // Redirect to login
    } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
}
```

---

## 🧪 Testing Checklist

### Profile Update
- [ ] Form hiển thị đúng thông tin user hiện tại
- [ ] Cập nhật tên thành công
- [ ] Cập nhật email thành công
- [ ] Cập nhật số điện thoại thành công
- [ ] Toast notification hiển thị
- [ ] Loading state hoạt động
- [ ] Error handling hoạt động

### Password Change
- [ ] Form validation hoạt động
- [ ] Đổi mật khẩu thành công
- [ ] Toast notification hiển thị
- [ ] Form được clear sau khi thành công
- [ ] Error hiển thị khi mật khẩu cũ sai

### Address Management
- [ ] Load danh sách addresses từ API
- [ ] Tạo address mới thành công
- [ ] Update address thành công
- [ ] Xóa address thành công
- [ ] Set default address thành công
- [ ] Không thể xóa default address (error message hiển thị)

### Payment Method Management
- [ ] Load danh sách payment methods từ API
- [ ] Tạo payment method mới thành công
- [ ] Update payment method thành công
- [ ] Xóa payment method thành công
- [ ] Set default payment method thành công
- [ ] Không thể xóa default payment method (error message hiển thị)

---

## 📝 Example Implementation

Tôi sẽ tạo một file example để bạn tham khảo:

```typescript
// Example: Update Profile Form Handler
const ProfileUpdateForm = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        avatarUrl: user?.avatarUrl || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.fullName.trim()) {
            toast.error('Họ tên không được để trống');
            return;
        }

        setLoading(true);

        try {
            await profileApi.updateProfile(formData);
            toast.success('Cập nhật thông tin thành công!');
            
            // Reload user data
            const updatedUser = await authApi.getCurrentUser();
            // Update context or local storage
        } catch (error: any) {
            const message = error.response?.data?.message || 'Có lỗi xảy ra';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Họ và tên"
            />
            {/* More fields... */}
            <Button type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
        </form>
    );
};
```

---

## 🚀 Ready to Integrate!

API service đã sẵn sàng! Bạn có thể:
1. ✅ Import `profileApi` vào ProfilePage
2. ✅ Replace mock data với API calls
3. ✅ Add form handlers
4. ✅ Add loading states
5. ✅ Add error handling

Bạn muốn tôi giúp implement các handlers này vào ProfilePage không? 🎉
