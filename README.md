# Food & Care E-Commerce Platform

> Nền tảng thương mại điện tử với tính năng đặt hàng định kỳ (subscription) cho các sản phẩm thiết yếu hàng ngày.

## 🎯 Tổng Quan

Food & Care là một nền tảng e-commerce chuyên bán các sản phẩm thiết yếu với tính năng đặt hàng định kỳ tự động, giúp khách hàng tiết kiệm thời gian và chi phí.

### Tính Năng Chính

- ✅ **Đặt hàng định kỳ (Subscription)**: Tự động giao hàng theo lịch (hàng tuần, 2 tuần, hàng tháng)
- ✅ **Hệ thống hạng thành viên**: 4 cấp (Đồng, Bạc, Vàng, Bạch Kim) với ưu đãi riêng
- ✅ **Giảm giá đa cấp**: Kết hợp giảm giá theo hạng, đơn định kỳ, và mã giảm giá
- ✅ **Tích hợp Zalo**: Thông báo tự động qua Zalo Official Account
- ✅ **Thanh toán đa dạng**: MoMo, ZaloPay, thẻ ngân hàng
- ✅ **Đánh giá sản phẩm**: Hệ thống review với xác thực mua hàng

## 🛠️ Tech Stack

### Backend
- **.NET 8 Web API** - Clean Architecture
- **PostgreSQL** (Supabase) - Database
- **Entity Framework Core 8** - ORM (Code-First)
- **JWT Bearer** - Authentication
- **Quartz.NET** - Background Jobs (Subscription automation)
- **Serilog** - Logging
- **AutoMapper** - Object mapping
- **BCrypt.Net** - Password hashing

### Frontend (Coming Soon)
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS v4.0** - Styling
- **Shadcn UI** - Component library
- **React Query** - Server state management
- **Axios** - HTTP client

## 📁 Cấu Trúc Dự Án

```
Food-Care-FNC/
├── FoodCare.API/                 # Backend API
│   ├── Models/
│   │   ├── Entities/             # 20 domain entities
│   │   ├── DTOs/                 # Data Transfer Objects
│   │   └── Enums/                # Enumerations
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   └── Repositories/
│   ├── Services/
│   │   ├── Interfaces/
│   │   └── Implementations/
│   ├── Controllers/              # API endpoints
│   ├── Jobs/                     # Quartz.NET background jobs
│   ├── Middleware/               # Custom middleware
│   └── Helpers/                  # Utility classes
│
└── food-care-frontend/           # Frontend (To be created)
    └── src/
        ├── components/
        ├── pages/
        ├── contexts/
        └── services/
```

## 🗄️ Database Schema

### Module A: Users & Membership
- `member_tiers` - Hạng thành viên (Bronze, Silver, Gold, Platinum)
- `users` - Người dùng
- `addresses` - Địa chỉ giao hàng
- `payment_methods` - Phương thức thanh toán

### Module B: Catalog & Inventory
- `categories` - Danh mục sản phẩm
- `suppliers` - Nhà cung cấp
- `products` - Sản phẩm
- `inventory_logs` - Lịch sử tồn kho

### Module C: Orders & Transactions
- `coupons` - Mã giảm giá
- `coupon_usage` - Lịch sử sử dụng coupon
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `order_status_history` - Lịch sử trạng thái đơn hàng

### Module D: Subscription Engine (Core USP)
- `subscriptions` - Đơn hàng định kỳ
- `subscription_schedules` - Lịch giao hàng định kỳ

### Module E: Engagement & Zalo
- `reviews` - Đánh giá sản phẩm
- `review_helpful` - Đánh giá hữu ích
- `notifications` - Thông báo
- `zalo_templates` - Mẫu tin nhắn Zalo
- `zalo_messages_log` - Lịch sử tin nhắn Zalo

## 🚀 Hướng Dẫn Cài Đặt

### Prerequisites

- .NET 8 SDK
- PostgreSQL (hoặc Supabase account)
- Node.js 18+ (cho frontend)

### Backend Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd Food-Care-FNC/FoodCare.API
   ```

2. **Cấu hình Database**
   
   Mở `appsettings.json` và cập nhật connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=YOUR_HOST;Database=YOUR_DB;Username=YOUR_USER;Password=YOUR_PASSWORD;SSL Mode=Require"
     }
   }
   ```

3. **Cấu hình JWT Secret**
   
   Thay đổi `JwtSettings:SecretKey` trong `appsettings.json` (tối thiểu 32 ký tự)

4. **Restore packages**
   ```bash
   dotnet restore
   ```

5. **Tạo migration**
   ```bash
   dotnet ef migrations add InitialCreate
   ```

6. **Apply migration**
   ```bash
   dotnet ef database update
   ```
   
   Lệnh này sẽ tạo 20 tables và seed data (4 member tiers, 4 categories)

7. **Chạy API**
   ```bash
   dotnet run
   ```
   
   API sẽ chạy tại: `https://localhost:7xxx`
   
   Swagger UI: `https://localhost:7xxx/swagger`

### Frontend Setup (Coming Soon)

```bash
cd food-care-frontend
npm install
npm run dev
```

## 📝 API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/google` - Đăng nhập Google OAuth

### Products
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/{id}` - Chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (Admin)
- `PUT /api/products/{id}` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/{id}` - Xóa sản phẩm (Admin)

### Orders
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/{id}` - Chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng
- `PUT /api/orders/{id}/status` - Cập nhật trạng thái (Admin)

### Subscriptions
- `GET /api/subscriptions` - Danh sách đơn định kỳ
- `POST /api/subscriptions` - Tạo đơn định kỳ
- `PUT /api/subscriptions/{id}` - Cập nhật đơn định kỳ
- `PUT /api/subscriptions/{id}/pause` - Tạm dừng
- `PUT /api/subscriptions/{id}/resume` - Tiếp tục
- `DELETE /api/subscriptions/{id}` - Hủy đơn định kỳ

## 🔐 Environment Variables

Tạo file `appsettings.Development.json` (không commit vào Git):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_ACTUAL_CONNECTION_STRING"
  },
  "JwtSettings": {
    "SecretKey": "YOUR_ACTUAL_SECRET_KEY"
  },
  "GoogleOAuth": {
    "ClientId": "YOUR_GOOGLE_CLIENT_ID",
    "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
  }
}
```

## 📊 Hệ Thống Hạng Thành Viên

| Hạng | Chi Tiêu Tối Thiểu | Giảm Giá | Miễn Phí Ship | Quyền Lợi Khác |
|------|-------------------|----------|---------------|----------------|
| **Đồng (Bronze)** | 0đ | 0% | - | Ưu đãi cơ bản |
| **Bạc (Silver)** | 2,000,000đ | 5% | Đơn > 300k | - |
| **Vàng (Gold)** | 5,000,000đ | 10% | Tất cả đơn | Quà sinh nhật |
| **Bạch Kim (Platinum)** | 10,000,000đ | 15% | Tất cả đơn | Ưu tiên hỗ trợ, Quà đặc biệt |

## 💰 Giảm Giá Đơn Định Kỳ

| Tần Suất | Giảm Giá |
|----------|----------|
| Hàng tuần | 15% |
| 2 tuần/lần | 12% |
| Hàng tháng | 10% |

**Lưu ý**: Giảm giá định kỳ được cộng dồn với giảm giá theo hạng thành viên!

## 🧪 Testing

```bash
# Unit tests
dotnet test

# Integration tests
dotnet test --filter "Category=Integration"
```

## 📖 Documentation

- [Implementation Plan](./implementation_plan.md) - Kế hoạch triển khai chi tiết
- [Walkthrough](./walkthrough.md) - Hướng dẫn từng bước
- [API Documentation](https://localhost:7xxx/swagger) - Swagger UI

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Backend**: .NET 8 Web API
- **Frontend**: React + TypeScript
- **Database**: Supabase (PostgreSQL)

## 📞 Contact

For questions or support, please contact: [your-email@example.com]

---

**Status**: 🚧 In Development

**Current Phase**: Phase 2 Complete - Database & Domain Models ✅

**Next Phase**: Phase 3 - Backend Core Features (Auth, Products, Orders)
