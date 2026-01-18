# Profile Management Backend Implementation Summary

## ✅ Hoàn thành

Tôi đã implement đầy đủ backend cho các tính năng Profile Management theo yêu cầu của bạn.

---

## 📁 Files Created/Modified

### Backend (C# .NET)

#### 1. DTOs (Data Transfer Objects)
**File**: `FoodCare.API/Models/DTOs/Profile/ProfileDTOs.cs`
- `UpdateProfileRequest` - Cập nhật thông tin cá nhân
- `ChangePasswordRequest` - Đổi mật khẩu
- `AddressRequest` - Tạo/cập nhật địa chỉ
- `PaymentMethodRequest` - Tạo/cập nhật phương thức thanh toán
- `AddressResponse` - Response cho địa chỉ
- `PaymentMethodResponse` - Response cho phương thức thanh toán

#### 2. Service Interface
**File**: `FoodCare.API/Services/Interfaces/IProfileService.cs`
- Định nghĩa 16 methods cho profile management

#### 3. Service Implementation
**File**: `FoodCare.API/Services/Implementations/ProfileService.cs`
- **Profile Management**:
  - `UpdateProfileAsync` - Cập nhật profile (bao gồm cả email qua Supabase Auth)
  - `ChangePasswordAsync` - Đổi mật khẩu qua Supabase Auth

- **Address Management**:
  - `GetAddressesAsync` - Lấy danh sách địa chỉ
  - `GetAddressByIdAsync` - Lấy chi tiết 1 địa chỉ
  - `CreateAddressAsync` - Tạo địa chỉ mới
  - `UpdateAddressAsync` - Cập nhật địa chỉ
  - `DeleteAddressAsync` - Xóa địa chỉ
  - `SetDefaultAddressAsync` - Đặt địa chỉ mặc định

- **Payment Method Management**:
  - `GetPaymentMethodsAsync` - Lấy danh sách phương thức thanh toán
  - `GetPaymentMethodByIdAsync` - Lấy chi tiết 1 phương thức
  - `CreatePaymentMethodAsync` - Tạo phương thức mới
  - `UpdatePaymentMethodAsync` - Cập nhật phương thức
  - `DeletePaymentMethodAsync` - Xóa phương thức
  - `SetDefaultPaymentMethodAsync` - Đặt phương thức mặc định

#### 4. Controller
**File**: `FoodCare.API/Controllers/ProfileController.cs`
- 14 API endpoints với đầy đủ error handling
- Authorization required cho tất cả endpoints
- Swagger documentation

#### 5. Program.cs
**Modified**: Đã register `ProfileService` vào DI container

---

## 🔐 Security Features

### 1. Authentication & Authorization
- ✅ Tất cả endpoints yêu cầu JWT authentication
- ✅ User chỉ có thể truy cập dữ liệu của chính mình
- ✅ UserId được lấy từ JWT token claims

### 2. Password Management
- ✅ Verify mật khẩu cũ trước khi đổi
- ✅ Validation mật khẩu mới (min 6 ký tự)
- ✅ Confirm password phải khớp
- ✅ Sử dụng Supabase Auth để quản lý mật khẩu

### 3. Data Protection
- ✅ `ProviderToken` không bao giờ được trả về trong response
- ✅ Chỉ trả về `Last4Digits` của payment method

---

## 🛡️ Business Logic Protection

### 1. Default Items Protection
- ✅ Không thể xóa địa chỉ/phương thức mặc định nếu còn items khác
- ✅ Khi set item mới làm default, tự động unset các default cũ
- ✅ Chỉ có 1 default item tại một thời điểm

### 2. Data Validation
- ✅ Required fields validation
- ✅ Email format validation
- ✅ Phone number format validation
- ✅ String length validation
- ✅ Custom business rules validation

---

## 📡 API Endpoints Summary

### Profile Management (2 endpoints)
```
PUT    /api/profile                              - Update profile
POST   /api/profile/change-password              - Change password
```

### Address Management (6 endpoints)
```
GET    /api/profile/addresses                    - Get all addresses
GET    /api/profile/addresses/{id}               - Get address by ID
POST   /api/profile/addresses                    - Create address
PUT    /api/profile/addresses/{id}               - Update address
DELETE /api/profile/addresses/{id}               - Delete address
PATCH  /api/profile/addresses/{id}/set-default   - Set default address
```

### Payment Method Management (6 endpoints)
```
GET    /api/profile/payment-methods              - Get all payment methods
GET    /api/profile/payment-methods/{id}         - Get payment method by ID
POST   /api/profile/payment-methods              - Create payment method
PUT    /api/profile/payment-methods/{id}         - Update payment method
DELETE /api/profile/payment-methods/{id}         - Delete payment method
PATCH  /api/profile/payment-methods/{id}/set-default - Set default payment method
```

**Total**: 14 endpoints

---

## 🔄 Integration với Supabase Auth

### Email Update
```csharp
var attributes = new Supabase.Gotrue.UserAttributes
{
    Email = request.Email
};
await _supabaseClient.Auth.Update(attributes);
```

### Password Change
```csharp
// 1. Verify current password
var session = await _supabaseClient.Auth.SignIn(user.Email, request.CurrentPassword);

// 2. Update to new password
var attributes = new Supabase.Gotrue.UserAttributes
{
    Password = request.NewPassword
};
await _supabaseClient.Auth.Update(attributes);
```

---

## 📊 Database Tables Used

### 1. Users Table
- Cập nhật: `FullName`, `Email`, `PhoneNumber`, `AvatarUrl`, `UpdatedAt`

### 2. Addresses Table
- Columns: `Id`, `UserId`, `RecipientName`, `PhoneNumber`, `AddressLine1`, `AddressLine2`, `City`, `District`, `Ward`, `IsDefault`, `CreatedAt`

### 3. PaymentMethods Table
- Columns: `Id`, `UserId`, `Provider`, `ProviderToken`, `Last4Digits`, `ExpiryDate`, `IsDefault`, `CreatedAt`

---

## ✨ Features Implemented

### ✅ Thay đổi thông tin cá nhân
- Họ tên
- Email (sync với Supabase Auth)
- Số điện thoại
- Avatar URL
- Button "Lưu thay đổi" → `PUT /api/profile`

### ✅ Quản lý địa chỉ giao hàng
- Xem danh sách địa chỉ
- Thêm địa chỉ mới
- Sửa địa chỉ
- Xóa địa chỉ
- Đặt địa chỉ mặc định

### ✅ Quản lý phương thức thanh toán
- Xem danh sách phương thức
- Thêm phương thức mới
- Sửa phương thức
- Xóa phương thức
- Đặt phương thức mặc định

### ✅ Đổi mật khẩu
- Verify mật khẩu hiện tại
- Nhập mật khẩu mới
- Xác nhận mật khẩu mới
- Button "Đổi mật khẩu" → `POST /api/profile/change-password`

---

## 🧪 Testing

### Swagger UI
1. Start backend: `dotnet run` trong folder `FoodCare.API`
2. Truy cập: `http://localhost:5000/swagger`
3. Click "Authorize" và nhập: `Bearer <your-jwt-token>`
4. Test các endpoints

### Get JWT Token
```bash
# Login to get token
POST http://localhost:5000/api/auth/login
{
  "email": "your@email.com",
  "password": "yourpassword"
}

# Response will contain token
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

---

## 📝 Next Steps - Frontend Integration

### 1. Tạo API Service
```typescript
// services/profileApi.ts
export const profileApi = {
  updateProfile: (data: UpdateProfileRequest) => 
    api.put('/profile', data),
  
  changePassword: (data: ChangePasswordRequest) => 
    api.post('/profile/change-password', data),
  
  // Addresses
  getAddresses: () => api.get('/profile/addresses'),
  createAddress: (data: AddressRequest) => 
    api.post('/profile/addresses', data),
  updateAddress: (id: string, data: AddressRequest) => 
    api.put(`/profile/addresses/${id}`, data),
  deleteAddress: (id: string) => 
    api.delete(`/profile/addresses/${id}`),
  setDefaultAddress: (id: string) => 
    api.patch(`/profile/addresses/${id}/set-default`),
  
  // Payment Methods
  getPaymentMethods: () => api.get('/profile/payment-methods'),
  createPaymentMethod: (data: PaymentMethodRequest) => 
    api.post('/profile/payment-methods', data),
  updatePaymentMethod: (id: string, data: PaymentMethodRequest) => 
    api.put(`/profile/payment-methods/${id}`, data),
  deletePaymentMethod: (id: string) => 
    api.delete(`/profile/payment-methods/${id}`),
  setDefaultPaymentMethod: (id: string) => 
    api.patch(`/profile/payment-methods/${id}/set-default`),
};
```

### 2. Update ProfilePage.tsx
- Thay mock data bằng API calls
- Add form submission handlers
- Add loading states
- Add error handling với toast notifications

### 3. Add Confirmation Dialogs
- Confirm trước khi xóa address/payment method
- Confirm trước khi đổi mật khẩu

---

## 🎯 Testing Checklist

### Profile Update
- [ ] Update tên thành công
- [ ] Update email thành công (check Supabase)
- [ ] Update số điện thoại thành công
- [ ] Update avatar URL thành công
- [ ] Validation errors hiển thị đúng

### Password Change
- [ ] Đổi mật khẩu với current password đúng
- [ ] Reject với current password sai
- [ ] Validation: new password phải >= 6 ký tự
- [ ] Validation: confirm password phải khớp
- [ ] Login với mật khẩu mới thành công

### Address Management
- [ ] Lấy danh sách addresses
- [ ] Tạo address mới
- [ ] Update address
- [ ] Xóa address (không phải default)
- [ ] Không thể xóa default address nếu còn addresses khác
- [ ] Set address làm default
- [ ] Chỉ có 1 default address

### Payment Method Management
- [ ] Lấy danh sách payment methods
- [ ] Tạo payment method mới
- [ ] Update payment method
- [ ] Xóa payment method (không phải default)
- [ ] Không thể xóa default payment method nếu còn methods khác
- [ ] Set payment method làm default
- [ ] Chỉ có 1 default payment method
- [ ] ProviderToken không được trả về trong response

---

## 📚 Documentation Files

1. **PROFILE_API_DOCUMENTATION.md** - Chi tiết tất cả API endpoints
2. **PROFILEPAGE_IMPLEMENTATION.md** - Frontend ProfilePage implementation
3. **PROFILE_BACKEND_SUMMARY.md** - File này

---

## 🚀 Ready to Use!

Backend đã sẵn sàng! Bạn có thể:
1. ✅ Test ngay với Swagger UI
2. ✅ Integrate với frontend ProfilePage
3. ✅ Tất cả features đã được implement đầy đủ

Nếu cần thêm features hoặc có vấn đề gì, hãy cho tôi biết! 🎉
