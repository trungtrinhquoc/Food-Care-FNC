# Hướng Dẫn Setup Database

## Bước 1: Cấu hình Supabase Connection String

Mở file `FoodCare.API/appsettings.json` và cập nhật connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=YOUR_SUPABASE_HOST;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true"
  }
}
```

**Lấy thông tin từ Supabase:**
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Settings** → **Database**
4. Copy **Connection string** (chọn mode "Session")
5. Thay thế `[YOUR-PASSWORD]` bằng database password của bạn

## Bước 2: Tạo Migration

Mở terminal tại thư mục `FoodCare.API` và chạy:

```bash
dotnet ef migrations add InitialCreate
```

Lệnh này sẽ tạo migration cho tất cả 20 tables.

## Bước 3: Apply Migration

```bash
dotnet ef database update
```

Lệnh này sẽ:
- Tạo tất cả 20 tables trong Supabase
- Seed data cho 4 Member Tiers (Đồng, Bạc, Vàng, Bạch Kim)
- Seed data cho 4 Categories

## Bước 4: Verify Database

Kiểm tra trong Supabase Dashboard:
1. Vào **Table Editor**
2. Xác nhận các tables đã được tạo:
   - member_tiers (4 rows)
   - categories (4 rows)
   - users
   - products
   - orders
   - subscriptions
   - ... (tổng 20 tables)

## Bước 5: Chạy Backend

```bash
cd FoodCare.API
dotnet run
```

API sẽ chạy tại: `https://localhost:7000`

Swagger UI: `https://localhost:7000/swagger`

## Bước 6: Test API

### Test với Swagger UI

1. Mở `https://localhost:7000/swagger`
2. Test endpoint `/api/auth/register`:
   ```json
   {
     "email": "test@example.com",
     "password": "Test123!",
     "fullName": "Nguyen Van A",
     "phone": "0123456789"
   }
   ```
3. Copy JWT token từ response
4. Click **Authorize** button ở góc phải
5. Nhập: `Bearer YOUR_TOKEN`
6. Test các endpoints khác

### Test với Postman/Thunder Client

**1. Register:**
```
POST https://localhost:7000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!",
  "fullName": "Nguyen Van A"
}
```

**2. Login:**
```
POST https://localhost:7000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!"
}
```

**3. Get Products:**
```
GET https://localhost:7000/api/products
```

**4. Get Current User (cần token):**
```
GET https://localhost:7000/api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

## Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra connection string
- Kiểm tra Supabase project có đang active
- Kiểm tra IP của bạn đã được whitelist trong Supabase

### Lỗi: "A network-related or instance-specific error"
- Thêm `;Trust Server Certificate=true` vào connection string
- Kiểm tra firewall/antivirus

### Lỗi: "Password authentication failed"
- Kiểm tra lại password trong connection string
- Reset password trong Supabase Dashboard nếu cần

### Lỗi: "Migration already applied"
```bash
# Xóa migration và tạo lại
dotnet ef migrations remove
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Seed Data Mặc Định

### Member Tiers
1. **Đồng (Bronze)**: 0% discount, 0đ - 2,000,000đ
2. **Bạc (Silver)**: 5% discount, 2,000,000đ - 5,000,000đ, Free ship > 300k
3. **Vàng (Gold)**: 10% discount, 5,000,000đ - 10,000,000đ, Free ship
4. **Bạch Kim (Platinum)**: 15% discount, > 10,000,000đ, Free ship + VIP support

### Categories
1. Dry Food (thuc-pham-kho)
2. Beverages (do-uong)
3. Household (ve-sinh)
4. Cooking (thuc-pham)

## Next Steps

Sau khi database đã setup xong:
1. Tạo admin user đầu tiên
2. Thêm products vào database
3. Test subscription flow
4. Setup frontend để connect với backend
