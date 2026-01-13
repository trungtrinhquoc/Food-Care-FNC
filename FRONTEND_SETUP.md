# Hướng Dẫn Chạy Frontend

## Prerequisites

- Node.js 18+ đã được cài đặt
- Backend API đang chạy tại `https://localhost:7000`

## Bước 1: Cài Đặt Dependencies

```bash
cd food-care-frontend
npm install
```

## Bước 2: Cấu Hình Environment

Tạo file `.env` trong thư mục `food-care-frontend`:

```bash
cp .env.example .env
```

Nội dung file `.env`:
```
VITE_API_URL=https://localhost:7000/api
```

**Lưu ý:** Nếu backend chạy ở port khác, cập nhật URL cho phù hợp.

## Bước 3: Chạy Development Server

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## Bước 4: Build Production

```bash
npm run build
```

Output sẽ được tạo trong thư mục `dist/`

## Bước 5: Preview Production Build

```bash
npm run preview
```

## Tính Năng Đã Hoàn Thành

### ✅ Authentication
- Đăng ký tài khoản mới
- Đăng nhập
- Đăng xuất
- Lưu token tự động
- Protected routes (yêu cầu đăng nhập)

### ✅ Product Browsing
- Xem danh sách sản phẩm
- Lọc và tìm kiếm
- Phân trang
- Thêm vào giỏ hàng

### ✅ Shopping Cart
- Thêm/xóa sản phẩm
- Cập nhật số lượng
- Tính tổng tiền
- Lưu giỏ hàng (localStorage)

### ✅ User Profile
- Xem thông tin cá nhân
- Hiển thị hạng thành viên
- Điểm tích lũy
- Tổng chi tiêu

## Cấu Trúc Thư Mục

```
food-care-frontend/
├── src/
│   ├── components/        # Reusable components
│   │   └── Header.tsx
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── CartContext.tsx
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── CartPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/          # API services
│   │   └── api.ts
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── App.tsx            # Main app component
│   ├── index.css          # Global styles + Tailwind
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── .env                   # Environment variables
├── .env.example           # Environment template
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS 3.4** - Styling
- **React Router 7** - Routing
- **React Query** - Server state management
- **Axios** - HTTP client
- **Lucide React** - Icons

## Testing với Backend

### 1. Đăng ký tài khoản mới

1. Mở `http://localhost:5173`
2. Click "Đăng nhập"
3. Chuyển sang tab "Đăng ký"
4. Điền thông tin và submit
5. Sau khi đăng ký thành công, bạn sẽ tự động đăng nhập

### 2. Xem sản phẩm

1. Click "Sản phẩm" trên menu
2. Danh sách sản phẩm sẽ được load từ API
3. Click vào sản phẩm để xem chi tiết

### 3. Thêm vào giỏ hàng

1. Ở trang sản phẩm, click "Thêm vào giỏ"
2. Icon giỏ hàng sẽ hiển thị số lượng
3. Click icon giỏ hàng để xem chi tiết

### 4. Xem profile

1. Click vào tên user ở góc phải
2. Xem thông tin cá nhân, hạng thành viên, điểm tích lũy

## Troubleshooting

### Lỗi: "Network Error" khi call API

**Nguyên nhân:** Backend chưa chạy hoặc CORS chưa được cấu hình

**Giải pháp:**
1. Kiểm tra backend đang chạy: `https://localhost:7000/health`
2. Kiểm tra CORS trong `Program.cs` đã allow `http://localhost:5173`

### Lỗi: "401 Unauthorized"

**Nguyên nhân:** Token hết hạn hoặc không hợp lệ

**Giải pháp:**
1. Đăng xuất và đăng nhập lại
2. Clear localStorage: `localStorage.clear()`

### Lỗi: Build failed

**Nguyên nhân:** TypeScript errors hoặc dependency issues

**Giải pháp:**
```bash
# Xóa node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Hoặc clear cache
npm cache clean --force
npm install
```

### Lỗi: "Cannot find module"

**Nguyên nhân:** Import path không đúng

**Giải pháp:**
- Kiểm tra import paths
- Đảm bảo file extension đúng (.ts, .tsx)
- Restart dev server

## Next Steps

Các tính năng cần phát triển tiếp:

1. **Product Detail Page** - Hiển thị chi tiết sản phẩm, reviews
2. **Checkout Flow** - Chọn địa chỉ, thanh toán
3. **Subscription Management** - Tạo, quản lý đơn định kỳ
4. **Order History** - Xem lịch sử đơn hàng
5. **Address Management** - Thêm/sửa/xóa địa chỉ
6. **Payment Methods** - Quản lý phương thức thanh toán
7. **Admin Dashboard** - Quản lý sản phẩm, đơn hàng (cho Admin)

## Performance Tips

1. **Lazy Loading:** Sử dụng `React.lazy()` cho các pages lớn
2. **Image Optimization:** Compress images trước khi upload
3. **Code Splitting:** Vite tự động split code theo routes
4. **Caching:** React Query tự động cache API responses
5. **Memoization:** Sử dụng `useMemo` và `useCallback` khi cần

## Deployment

### Build cho production

```bash
npm run build
```

### Deploy lên Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy lên Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Environment Variables cho Production

Nhớ set environment variables trên hosting platform:
- `VITE_API_URL` - URL của production API
