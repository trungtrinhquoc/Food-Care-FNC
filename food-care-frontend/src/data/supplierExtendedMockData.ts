import type { SupplierProduct } from '../types/supplier';

// Mock Products Data
export const mockProducts: SupplierProduct[] = [
  {
    id: 'PROD-001',
    name: 'Thịt bò nhập khẩu',
    description: 'Thịt bò Mỹ cao cấp, tươi ngon',
    basePrice: 250000,
    price: 250000,
    cost: 180000,
    stockQuantity: 5,
    stock: 5,
    minStock: 10,
    maxStock: 50,
    sku: 'BEEF-US-001',
    category: 'Thịt',
    image: '/images/beef.jpg',
    images: ['/images/beef.jpg'],
    isActive: true,
    status: 'active',
    createdAt: '2024-01-20T08:00:00Z',
    orderCount: 45,
    soldCount: 45,
    totalRevenue: 11250000
  },
  {
    id: 'PROD-002',
    name: 'Rau hữu cơ',
    description: 'Rau sạch từ nông trại hữu cơ',
    basePrice: 45000,
    price: 45000,
    cost: 25000,
    stockQuantity: 25,
    stock: 25,
    minStock: 15,
    maxStock: 100,
    sku: 'VEG-ORG-002',
    category: 'Rau củ',
    image: '/images/vegetables.jpg',
    images: ['/images/vegetables.jpg'],
    isActive: true,
    status: 'active',
    createdAt: '2024-01-21T09:00:00Z',
    orderCount: 32,
    soldCount: 32,
    totalRevenue: 1440000
  },
  {
    id: 'PROD-003',
    name: 'Cá hồi tươi',
    description: 'Cá hồi Na Uy tươi ngon',
    basePrice: 380000,
    price: 380000,
    cost: 280000,
    stockQuantity: 8,
    stock: 8,
    minStock: 5,
    maxStock: 30,
    sku: 'FISH-SAL-003',
    category: 'Hải sản',
    image: '/images/salmon.jpg',
    images: ['/images/salmon.jpg'],
    isActive: true,
    status: 'active',
    createdAt: '2024-01-22T10:00:00Z',
    orderCount: 28,
    soldCount: 28,
    totalRevenue: 10640000
  },
  {
    id: 'PROD-004',
    name: 'Gà organic',
    description: 'Gà nuôi hữu cơ không hóa chất',
    basePrice: 120000,
    price: 120000,
    cost: 80000,
    stockQuantity: 2,
    stock: 2,
    minStock: 10,
    maxStock: 40,
    sku: 'CHICK-ORG-004',
    category: 'Thịt',
    image: '/images/chicken.jpg',
    images: ['/images/chicken.jpg'],
    isActive: true,
    status: 'active',
    createdAt: '2024-01-23T11:00:00Z',
    orderCount: 18,
    soldCount: 18,
    totalRevenue: 2160000
  },
  {
    id: 'PROD-005',
    name: 'Trứng sạch',
    description: 'Trứng gà nuôi thả vườn',
    basePrice: 35000,
    price: 35000,
    cost: 20000,
    stockQuantity: 0,
    stock: 0,
    minStock: 20,
    maxStock: 200,
    sku: 'EGG-FRM-005',
    category: 'Khác',
    image: '/images/eggs.jpg',
    images: ['/images/eggs.jpg'],
    isActive: false,
    status: 'out_of_stock',
    createdAt: '2024-01-24T12:00:00Z',
    orderCount: 12,
    soldCount: 12,
    totalRevenue: 420000
  }
];

// Mock Revenue Data
export const mockRevenueData = {
  daily: [
    { date: '2024-01-20', revenue: 2500000 },
    { date: '2024-01-21', revenue: 3200000 },
    { date: '2024-01-22', revenue: 2800000 },
    { date: '2024-01-23', revenue: 3500000 },
    { date: '2024-01-24', revenue: 2900000 },
    { date: '2024-01-25', revenue: 4100000 },
    { date: '2024-01-26', revenue: 2500000 }
  ],
  monthly: [
    { month: '2023-08', revenue: 85000000 },
    { month: '2023-09', revenue: 92000000 },
    { month: '2023-10', revenue: 78000000 },
    { month: '2023-11', revenue: 95000000 },
    { month: '2023-12', revenue: 110000000 },
    { month: '2024-01', revenue: 45000000 }
  ],
  byCategory: [
    { category: 'Thịt', revenue: 28000000, percentage: 62.2 },
    { category: 'Rau củ', revenue: 8500000, percentage: 18.9 },
    { category: 'Hải sản', revenue: 6500000, percentage: 14.4 },
    { category: 'Khác', revenue: 2000000, percentage: 4.5 }
  ]
};

// Mock Reviews Data
export const mockReviews = [
  {
    id: 'REV-001',
    productId: 'PROD-001',
    productName: 'Thịt bò nhập khẩu',
    customerName: 'Nguyễn Văn A',
    rating: 5,
    comment: 'Thịt rất tươi, ngon, giao hàng nhanh',
    createdAt: '2024-01-25T14:30:00Z',
    isVerified: true,
    images: [],
    response: null
  },
  {
    id: 'REV-002',
    productId: 'PROD-002',
    productName: 'Rau hữu cơ',
    customerName: 'Trần Thị B',
    rating: 4,
    comment: 'Rau tươi sạch, đóng gói tốt',
    createdAt: '2024-01-25T16:20:00Z',
    isVerified: true,
    images: [],
    response: null
  },
  {
    id: 'REV-003',
    productId: 'PROD-003',
    productName: 'Cá hồi tươi',
    customerName: 'Lê Văn C',
    rating: 5,
    comment: 'Cá rất tươi, không bị tanh',
    createdAt: '2024-01-26T09:15:00Z',
    isVerified: true,
    images: [],
    response: null
  },
  {
    id: 'REV-004',
    productId: 'PROD-001',
    productName: 'Thịt bò nhập khẩu',
    customerName: 'Phạm Thị D',
    rating: 3,
    comment: 'Thịt ngon nhưng giao hơi chậm',
    createdAt: '2024-01-26T11:45:00Z',
    isVerified: true,
    images: [],
    response: null
  },
  {
    id: 'REV-005',
    productId: 'PROD-004',
    productName: 'Gà organic',
    customerName: 'Hoàng Văn E',
    rating: 5,
    comment: 'Gà rất ngon, thịt chắc',
    createdAt: '2024-01-26T13:30:00Z',
    isVerified: true,
    images: [],
    response: null
  }
];
