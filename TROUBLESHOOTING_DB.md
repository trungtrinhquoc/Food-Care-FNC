# Hướng Dẫn Fix Lỗi "No such host is known"

## Nguyên nhân

Lỗi này xảy ra khi:
1. **Supabase project bị paused** (tự động pause sau 7 ngày không hoạt động)
2. **Hostname không đúng** 
3. **Network/DNS issues**

## Cách Fix

### Bước 1: Kiểm tra Supabase Project Status

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project `ezizxsgjtxprbacpirbm`
3. Kiểm tra status:
   - Nếu hiển thị **"Paused"** → Click **"Restore"** hoặc **"Resume"**
   - Đợi 1-2 phút để project active lại

### Bước 2: Lấy Connection String Mới

Sau khi project đã active:

1. Vào **Settings** → **Database**
2. Scroll xuống phần **Connection string**
3. Chọn tab **"URI"** hoặc **"Connection parameters"**
4. Copy thông tin:

**Cách 1: Sử dụng Connection Pooler (Khuyến nghị)**
```
Host: aws-0-ap-southeast-1.pooler.supabase.com
Port: 6543
Database: postgres
Username: postgres.ezizxsgjtxprbacpirbm
Password: [your-password]
```

**Cách 2: Direct Connection**
```
Host: db.ezizxsgjtxprbacpirbm.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: [your-password]
```

### Bước 3: Cập nhật Connection String

Mở file `appsettings.json` và cập nhật:

**Option 1: Connection Pooler (Khuyến nghị - ổn định hơn)**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.ezizxsgjtxprbacpirbm;Password=exe201FNC@123;SSL Mode=Require;Trust Server Certificate=true"
  }
}
```

**Option 2: Direct Connection**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=db.ezizxsgjtxprbacpirbm.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=exe201FNC@123;SSL Mode=Require;Trust Server Certificate=true"
  }
}
```

### Bước 4: Test Connection

Chạy lệnh test:
```bash
dotnet run --project TestConnection.cs
```

Hoặc thử migration lại:
```bash
dotnet ef database update
```

## Nếu Vẫn Lỗi

### 1. Kiểm tra Password

Password có thể đã thay đổi. Reset password:
1. Vào Supabase Dashboard
2. **Settings** → **Database**
3. Click **"Reset database password"**
4. Copy password mới
5. Cập nhật vào `appsettings.json`

### 2. Kiểm tra Network

```bash
# Test DNS resolution
ping db.ezizxsgjtxprbacpirbm.supabase.co

# Hoặc
nslookup db.ezizxsgjtxprbacpirbm.supabase.co
```

Nếu ping không được:
- Kiểm tra firewall/antivirus
- Thử đổi DNS sang 8.8.8.8 (Google DNS)
- Kiểm tra VPN nếu đang dùng

### 3. Sử dụng Connection Pooler

Connection Pooler ổn định hơn và được khuyến nghị:

```json
"DefaultConnection": "Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.ezizxsgjtxprbacpirbm;Password=YOUR_PASSWORD;SSL Mode=Require"
```

**Lưu ý:** Username phải có format `postgres.PROJECT_REF`

### 4. Tạm thời tắt SSL (Chỉ để test)

```json
"DefaultConnection": "Host=db.ezizxsgjtxprbacpirbm.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=exe201FNC@123;SSL Mode=Disable"
```

**Cảnh báo:** Chỉ dùng để test, không dùng cho production!

## Alternative: Sử dụng Local PostgreSQL

Nếu không kết nối được Supabase, có thể dùng PostgreSQL local:

### Cài đặt PostgreSQL

1. Download PostgreSQL: https://www.postgresql.org/download/
2. Cài đặt với password: `postgres`
3. Cập nhật connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=foodcare;Username=postgres;Password=postgres"
  }
}
```

4. Chạy migration:
```bash
dotnet ef database update
```

## Checklist

- [ ] Supabase project đã active (không paused)
- [ ] Connection string đúng format (Host, Username, Password)
- [ ] Password đúng
- [ ] Network có thể kết nối đến Supabase
- [ ] Đã thử cả Direct Connection và Connection Pooler
- [ ] Firewall/Antivirus không block connection

## Liên hệ Support

Nếu vẫn không được, kiểm tra:
1. Supabase status page: https://status.supabase.com
2. Supabase Discord: https://discord.supabase.com
3. Check project logs trong Supabase Dashboard
