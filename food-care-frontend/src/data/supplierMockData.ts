import type { Order, KPIMetrics, Alert, FulfillmentMetrics } from '../types/supplier';

// Mock Orders Data
export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerId: 'CUST-001',
    customerName: 'Nguyễn Văn A',
    customerEmail: 'nguyenvana@email.com',
    customerPhone: '0912345678',
    items: [
      {
        id: 'ITEM-001',
        productId: 'PROD-001',
        productName: 'Thịt bò nhập khẩu',
        quantity: 2,
        price: 250000,
        totalPrice: 500000
      }
    ],
    totalAmount: 500000,
    status: 'pending',
    shippingAddress: {
      street: '123 Nguyễn Huệ',
      city: 'TP.HCM',
      state: 'Quận 1',
      zipCode: '700000',
      country: 'Vietnam'
    },
    createdAt: '2024-01-26T10:30:00Z',
    notes: 'Giao trước 12h trưa'
  },
  {
    id: 'ORD-002',
    customerId: 'CUST-002',
    customerName: 'Trần Thị B',
    customerEmail: 'tranthib@email.com',
    customerPhone: '0987654321',
    items: [
      {
        id: 'ITEM-002',
        productId: 'PROD-002',
        productName: 'Rau hữu cơ',
        quantity: 3,
        price: 45000,
        totalPrice: 135000
      }
    ],
    totalAmount: 135000,
    status: 'confirmed',
    shippingAddress: {
      street: '456 Lê Lợi',
      city: 'TP.HCM',
      state: 'Quận 3',
      zipCode: '710000',
      country: 'Vietnam'
    },
    createdAt: '2024-01-26T09:15:00Z',
    updatedAt: '2024-01-26T10:00:00Z'
  },
  {
    id: 'ORD-003',
    customerId: 'CUST-003',
    customerName: 'Lê Văn C',
    customerEmail: 'levanc@email.com',
    customerPhone: '0123456789',
    items: [
      {
        id: 'ITEM-003',
        productId: 'PROD-003',
        productName: 'Cá hồi tươi',
        quantity: 1,
        price: 380000,
        totalPrice: 380000
      }
    ],
    totalAmount: 380000,
    status: 'shipped',
    shippingAddress: {
      street: '789 Đồng Khởi',
      city: 'TP.HCM',
      state: 'Quận 5',
      zipCode: '720000',
      country: 'Vietnam'
    },
    createdAt: '2024-01-25T14:20:00Z',
    updatedAt: '2024-01-26T08:30:00Z'
  }
];

// Mock KPI Metrics
export const mockKPIMetrics: KPIMetrics = {
  revenue: {
    today: 2500000,
    month: 45000000,
    change: 12.5
  },
  orders: {
    new: 5,
    processing: 12,
    completed: 28,
    cancelled: 2
  },
  products: {
    total: 45,
    active: 38,
    lowStock: 4,
    outOfStock: 3
  },
  customers: {
    new: 8,
    returning: 15,
    total: 156
  }
};

// Mock Alerts
export const mockAlerts: Alert[] = [
  {
    id: 'ALERT-001',
    type: 'low_stock',
    title: 'Sắp hết hàng',
    message: 'Thịt bò nhập khẩu còn lại 5 phần',
    severity: 'high',
    isRead: false,
    createdAt: '2024-01-26T11:00:00Z',
    data: { productId: 'PROD-001', currentStock: 5, minStock: 10 }
  },
  {
    id: 'ALERT-002',
    type: 'new_order',
    title: 'Đơn hàng mới',
    message: 'Có 3 đơn hàng mới cần xác nhận',
    severity: 'medium',
    isRead: false,
    createdAt: '2024-01-26T10:30:00Z'
  },
  {
    id: 'ALERT-003',
    type: 'shipping_delay',
    title: 'Chậm giao hàng',
    message: 'Đơn hàng ORD-003 bị chậm giao',
    severity: 'critical',
    isRead: true,
    createdAt: '2024-01-26T09:15:00Z',
    data: { orderId: 'ORD-003', delayHours: 2 }
  }
];

// Mock Fulfillment Metrics
export const mockFulfillmentMetrics: FulfillmentMetrics = {
  ordersByStatus: [
    { status: 'pending', count: 5 },
    { status: 'confirmed', count: 12 },
    { status: 'processing', count: 8 },
    { status: 'shipped', count: 15 },
    { status: 'delivered', count: 28 },
    { status: 'cancelled', count: 2 }
  ],
  fulfillmentRate: 92.5,
  averageFulfillmentTime: 4.2,
  onTimeDeliveryRate: 88.3,
  dailyProcessing: [
    { date: '2024-01-20', processed: 12, shipped: 10, delivered: 8 },
    { date: '2024-01-21', processed: 15, shipped: 13, delivered: 11 },
    { date: '2024-01-22', processed: 18, shipped: 16, delivered: 14 },
    { date: '2024-01-23', processed: 14, shipped: 12, delivered: 10 },
    { date: '2024-01-24', processed: 20, shipped: 18, delivered: 15 },
    { date: '2024-01-25', processed: 22, shipped: 20, delivered: 17 },
    { date: '2024-01-26', processed: 16, shipped: 14, delivered: 12 }
  ]
};
