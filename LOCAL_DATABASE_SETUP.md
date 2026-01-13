# Hướng Dẫn Cài Đặt PostgreSQL Local

Vì Supabase gặp vấn đề kết nối, bạn có thể dùng PostgreSQL local để phát triển.

## Cách 1: Sử Dụng Docker (Khuyến nghị - Nhanh nhất)

### Bước 1: Cài Docker Desktop
- Download: https://www.docker.com/products/docker-desktop/
- Cài đặt và khởi động Docker Desktop

### Bước 2: Chạy PostgreSQL Container

```bash
docker run --name foodcare-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

### Bước 3: Cập nhật Connection String

Mở `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres"
  }
}
```

### Bước 4: Chạy Migration

```bash
dotnet ef database update
```

### Quản lý Docker Container

```bash
# Dừng container
docker stop foodcare-postgres

# Khởi động lại
docker start foodcare-postgres

# Xóa container (cẩn thận - mất data!)
docker rm -f foodcare-postgres
```

---

## Cách 2: Cài PostgreSQL Trực Tiếp

### Bước 1: Download PostgreSQL
- Link: https://www.postgresql.org/download/windows/
- Chọn phiên bản 15.x

### Bước 2: Cài Đặt
1. Chạy installer
2. Chọn components: PostgreSQL Server, pgAdmin 4
3. Đặt password: `postgres` (hoặc password khác)
4. Port: `5432` (default)
5. Locale: `Default`
6. Hoàn tất cài đặt

### Bước 3: Tạo Database (Optional)

Mở **pgAdmin 4** hoặc **SQL Shell (psql)**:

```sql
CREATE DATABASE foodcare;
```

### Bước 4: Cập nhật Connection String

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=foodcare;Username=postgres;Password=postgres"
  }
}
```

### Bước 5: Chạy Migration

```bash
cd FoodCare.API
dotnet ef database update
```

---

## Cách 3: Sử Dụng SQL Server (Alternative)

Nếu đã có SQL Server:

### Bước 1: Cài Package

```bash
dotnet remove package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
```

### Bước 2: Cập nhật Program.cs

Thay:
```csharp
options.UseNpgsql(connectionString)
```

Bằng:
```csharp
options.UseSqlServer(connectionString)
```

### Bước 3: Connection String

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FoodCare;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

---

## Verify Migration Thành Công

Sau khi chạy `dotnet ef database update`, bạn sẽ thấy:

```
Build started...
Build succeeded.
Applying migration '20260112_InitialCreate'.
Done.
```

### Kiểm tra Tables

**Với Docker/PostgreSQL:**
```bash
# Vào PostgreSQL shell
docker exec -it foodcare-postgres psql -U postgres

# Hoặc nếu cài trực tiếp
psql -U postgres

# List tables
\dt

# Kiểm tra data
SELECT * FROM member_tiers;
SELECT * FROM categories;
```

Bạn sẽ thấy:
- 4 member tiers (Đồng, Bạc, Vàng, Bạch Kim)
- 4 categories
- 20 tables tổng cộng

---

## Chạy Backend API

```bash
cd FoodCare.API
dotnet run
```

API sẽ chạy tại: `https://localhost:7000`

Test với Swagger: `https://localhost:7000/swagger`

---

## Quay Lại Supabase Sau

Khi Supabase đã fix, chỉ cần:

1. Cập nhật connection string trong `appsettings.json`
2. Chạy lại migration:
```bash
dotnet ef database update
```

Data local sẽ không bị mất, bạn có thể giữ cả 2 để test.

---

## Troubleshooting

### Docker: "Cannot connect to Docker daemon"
- Mở Docker Desktop
- Đợi Docker khởi động hoàn toàn (icon màu xanh)

### PostgreSQL: "psql: command not found"
- Thêm PostgreSQL vào PATH:
  - Mở System Environment Variables
  - Thêm: `C:\Program Files\PostgreSQL\15\bin`

### Migration failed: "Database does not exist"
```bash
# Tạo database trước
docker exec -it foodcare-postgres psql -U postgres -c "CREATE DATABASE foodcare;"

# Hoặc trong psql:
CREATE DATABASE foodcare;
```

### Port 5432 đã được sử dụng
```bash
# Kiểm tra process đang dùng port
netstat -ano | findstr :5432

# Dừng PostgreSQL service nếu có
net stop postgresql-x64-15

# Hoặc đổi port trong Docker:
docker run --name foodcare-postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 -d postgres:15
```

---

## Khuyến Nghị

**Cho Development:** Dùng Docker - dễ setup, dễ xóa, không ảnh hưởng hệ thống

**Cho Production:** Dùng Supabase - managed service, backup tự động, scale dễ dàng

**Hiện tại:** Dùng Docker để tiếp tục phát triển, fix Supabase sau
