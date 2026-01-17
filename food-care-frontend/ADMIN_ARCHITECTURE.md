# Admin Dashboard - Architecture Documentation

## 📁 Cấu trúc thư mục

```
src/
├── types/
│   └── admin.ts                    # Admin-specific TypeScript types
├── constants/
│   └── admin.ts                    # Admin constants & configurations
├── services/
│   └── adminService.ts             # API calls & mock data
├── hooks/
│   ├── useProducts.ts              # Products logic hook
│   ├── useOrders.ts                # Orders logic hook
│   ├── useSuppliers.ts             # Suppliers logic hook
│   └── useZaloReminders.ts         # Zalo reminders logic hook
├── components/
│   └── admin/
│       ├── StatsCard.tsx           # Reusable stats card
│       ├── RevenueChart.tsx        # Revenue chart component
│       ├── BadgeComponents.tsx     # Status, Tier, Stock badges
│       ├── ProductDialog.tsx       # Product CRUD dialog
│       ├── SupplierDialog.tsx      # Supplier CRUD dialog
│       └── OrderDetailDialog.tsx   # Order detail view dialog
└── pages/
    ├── AdminDashboardPage.tsx      # Main admin page (orchestrator)
    └── admin/
        ├── OverviewTab.tsx         # Overview/Statistics tab
        ├── ProductsTab.tsx         # Products management tab
        ├── OrdersTab.tsx           # Orders management tab
        ├── CustomersTab.tsx        # Customers list tab
        ├── SuppliersTab.tsx        # Suppliers management tab
        └── ZaloTab.tsx             # Zalo reminders tab
```

## 🎯 Kiến trúc & Nguyên tắc

### 1. **Separation of Concerns**
- **Types**: Tất cả types riêng biệt trong `types/admin.ts`
- **Constants**: Cấu hình & mock data trong `constants/admin.ts`
- **Services**: API calls tập trung trong `adminService.ts`
- **Hooks**: Business logic tách khỏi UI components
- **Components**: UI thuần túy, nhận props và render

### 2. **Custom Hooks Pattern**
Mỗi domain có custom hook riêng:

```typescript
// useProducts.ts
export function useProducts(initialProducts) {
  const [products, setProducts] = useState(initialProducts);
  // ... business logic
  return {
    products,
    openProductDialog,
    saveProduct,
    deleteProduct,
    // ...
  };
}
```

**Lợi ích:**
- ✅ Logic tái sử dụng được
- ✅ Dễ test riêng biệt
- ✅ Component đơn giản hơn

### 3. **Component Composition**
Main page chỉ là orchestrator:

```typescript
export default function AdminDashboardPage() {
  const productsHook = useProducts(initialProducts);
  
  return (
    <ProductsTab
      products={productsHook.products}
      onAdd={productsHook.openProductDialog}
      // ...
    />
  );
}
```

### 4. **Reusable UI Components**
Các components nhỏ, tái sử dụng:
- `StatsCard`: Hiển thị thống kê
- `BadgeComponents`: Status, tier, stock badges
- `RevenueChart`: Biểu đồ doanh thu

## 📝 Quy tắc Code

### 1. **Props Interface**
Mỗi component có interface rõ ràng:

```typescript
interface ProductsTabProps {
  products: Product[];
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}
```

### 2. **Type Safety**
Sử dụng TypeScript strict mode:
- Không `any`
- Required vs Optional props rõ ràng
- Union types cho enums

### 3. **Naming Convention**
- **Components**: PascalCase (ProductDialog.tsx)
- **Hooks**: camelCase với prefix `use` (useProducts.ts)
- **Types**: PascalCase (AdminStats)
- **Constants**: UPPER_SNAKE_CASE (MOCK_STATS)

## 🧪 Testing Strategy

### 1. **Unit Tests**
Test từng layer riêng biệt:

```typescript
// useProducts.test.ts
describe('useProducts', () => {
  it('should add new product', () => {
    // Test hook logic
  });
});
```

### 2. **Component Tests**
Test UI components với mock props:

```typescript
// ProductsTab.test.tsx
describe('ProductsTab', () => {
  it('should render products list', () => {
    render(<ProductsTab products={mockProducts} />);
  });
});
```

### 3. **Integration Tests**
Test toàn bộ flow trong AdminDashboardPage

## 🔧 Bảo trì & Mở rộng

### Thêm Tab Mới
1. Tạo component trong `pages/admin/NewTab.tsx`
2. Import và thêm vào AdminDashboardPage
3. Thêm TabTrigger mới

### Thêm Feature Mới
1. **Types**: Thêm vào `types/admin.ts`
2. **Service**: Thêm API call vào `adminService.ts`
3. **Hook**: Tạo custom hook mới (nếu cần)
4. **Component**: Tạo UI component
5. **Integration**: Kết nối vào tab tương ứng

### Refactor Existing Code
1. Identify: Xác định code trùng lặp
2. Extract: Tách thành hook hoặc component
3. Test: Đảm bảo functionality không đổi
4. Replace: Thay thế code cũ
5. Clean: Xóa code không dùng

## 🚀 Performance

### 1. **Code Splitting**
Các tab được lazy load tự động với dynamic imports

### 2. **Memoization**
Sử dụng useCallback cho event handlers:

```typescript
const deleteProduct = useCallback((id) => {
  // logic
}, [products]);
```

### 3. **Optimistic Updates**
Update UI trước, sync với server sau

## 📊 Future Improvements

### Short-term (1-2 tuần)
- [ ] Kết nối với API backend thật
- [ ] Thêm loading states
- [ ] Error handling & retry logic
- [ ] Form validation với zod/yup

### Mid-term (1 tháng)
- [ ] Unit tests coverage 80%+
- [ ] E2E tests với Playwright
- [ ] Performance monitoring
- [ ] Accessibility (a11y) improvements

### Long-term (2-3 tháng)
- [ ] Real-time updates với WebSocket
- [ ] Advanced filtering & sorting
- [ ] Export functionality (Excel, PDF)
- [ ] Analytics dashboard
- [ ] Audit logs

## 🐛 Debugging Tips

### 1. **React DevTools**
Sử dụng Components tab để inspect props & state

### 2. **Console Logging**
Thêm debug logs trong hooks:

```typescript
useEffect(() => {
  console.log('Products updated:', products);
}, [products]);
```

### 3. **Network Tab**
Monitor API calls khi kết nối backend

## 📚 Resources

- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Component Patterns](https://www.patterns.dev/)
- [Testing Library](https://testing-library.com/)

## 👥 Contributing

1. Đọc architecture này trước khi code
2. Follow naming conventions
3. Write tests cho code mới
4. Update documentation khi thay đổi

## 📞 Support

Nếu có vấn đề, tạo issue với:
- Mô tả chi tiết
- Steps to reproduce
- Expected vs Actual behavior
- Screenshots (nếu có)
