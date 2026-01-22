import type { AdminStats, AdminCustomer, Supplier, ZaloReminder } from '../types/admin';

// Legacy mock order type for backwards compatibility
interface LegacyAdminOrder {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: string;
  items: number;
  subscription: boolean;
  products: string[];
  address: string;
  phone: string;
}

// Mock data - will be replaced with actual API calls
export const mockOrders: LegacyAdminOrder[] = [
  {
    id: 'ORD-001',
    customerName: 'Nguyễn Văn A',
    date: '2025-01-20',
    total: 450000,
    status: 'delivered',
    items: 3,
    subscription: true,
    products: ['Gạo ST25', 'Dầu ăn', 'Cà phê'],
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    phone: '0901234567',
  },
  {
    id: 'ORD-002',
    customerName: 'Trần Thị B',
    date: '2025-01-20',
    total: 680000,
    status: 'shipping',
    items: 5,
    subscription: false,
    products: ['Giấy vệ sinh', 'Nước giặt', 'Mì Ý', 'Ngũ cốc', 'Sữa'],
    address: '456 Lê Lợi, Q3, TP.HCM',
    phone: '0912345678',
  },
  {
    id: 'ORD-003',
    customerName: 'Lê Văn C',
    date: '2025-01-19',
    total: 320000,
    status: 'preparing',
    items: 2,
    subscription: true,
    products: ['Cà phê', 'Ngũ cốc'],
    address: '789 Trần Hưng Đạo, Q5, TP.HCM',
    phone: '0923456789',
  },
  {
    id: 'ORD-004',
    customerName: 'Phạm Thị D',
    date: '2025-01-19',
    total: 890000,
    status: 'pending',
    items: 7,
    subscription: false,
    products: ['Gạo ST25', 'Dầu ăn', 'Giấy vệ sinh', 'Nước giặt', 'Cà phê', 'Mì Ý', 'Sữa'],
    address: '321 Võ Văn Tần, Q3, TP.HCM',
    phone: '0934567890',
  },
];

export const mockCustomers: AdminCustomer[] = [
  {
    id: 'USR-001',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0901234567',
    memberTier: 'Gold',
    totalOrders: 42,
    totalSpent: 8500000,
    joinDate: '2024-01-15',
    subscriptions: 3,
  },
  {
    id: 'USR-002',
    name: 'Trần Thị B',
    email: 'tranthib@email.com',
    phone: '0912345678',
    memberTier: 'Silver',
    totalOrders: 28,
    totalSpent: 5200000,
    joinDate: '2024-03-20',
    subscriptions: 2,
  },
  {
    id: 'USR-003',
    name: 'Lê Văn C',
    email: 'levanc@email.com',
    phone: '0923456789',
    memberTier: 'Platinum',
    totalOrders: 65,
    totalSpent: 15000000,
    joinDate: '2023-11-10',
    subscriptions: 5,
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Công ty Lương Thực Miền Nam',
    products: ['Gạo ST25', 'Gạo Jasmine', 'Ngũ cốc'],
    totalProducts: 12,
    status: 'active',
    phone: '0281234567',
    email: 'contact@luongthucmn.vn',
    address: 'KCN Tân Bình, TP.HCM',
    contact: 'Nguyễn Văn A',
  },
  {
    id: 'SUP-002',
    name: 'Trung Nguyên Legend',
    products: ['Cà phê', 'Trà'],
    totalProducts: 8,
    status: 'active',
    phone: '0282345678',
    email: 'supplier@trungnguyenlegend.com',
    address: '123 Đường Cách Mạng, Q3, TP.HCM',
    contact: 'Trần Thị B',
  },
  {
    id: 'SUP-003',
    name: 'Unilever Việt Nam',
    products: ['Bột giặt', 'Nước rửa chén', 'Giấy vệ sinh'],
    totalProducts: 15,
    status: 'active',
    phone: '0283456789',
    email: 'partner@unilever.com.vn',
    address: 'KCN Vĩnh Lộc, Bình Chánh, TP.HCM',
    contact: 'Lê Văn C',
  },
];

export const mockZaloReminders: ZaloReminder[] = [
  {
    id: 'REM-001',
    customerName: 'Nguyễn Văn A',
    phone: '0901234567',
    product: 'Gạo ST25 5kg',
    estimatedDaysLeft: 5,
    lastPurchase: '2024-12-26',
    status: 'pending',
  },
  {
    id: 'REM-002',
    customerName: 'Trần Thị B',
    phone: '0912345678',
    product: 'Cà phê Trung Nguyên',
    estimatedDaysLeft: 3,
    lastPurchase: '2025-01-08',
    status: 'sent',
    sentDate: '2025-01-20',
  },
  {
    id: 'REM-003',
    customerName: 'Lê Văn C',
    phone: '0923456789',
    product: 'Bột giặt OMO',
    estimatedDaysLeft: 2,
    lastPurchase: '2024-12-23',
    status: 'pending',
  },
];

// Service functions (will be replaced with real API calls)
export const adminService = {
  // Stats
  async getStats(): Promise<AdminStats> {
    // TODO: Replace with actual API call
    return Promise.resolve({
      totalRevenue: 125000000,
      totalOrders: 1247,
      totalCustomers: 856,
      totalProducts: 45,
      monthlyGrowth: 12.5,
      activeSubscriptions: 342,
    });
  },

  // Orders (Legacy mock)
  async getOrders(): Promise<LegacyAdminOrder[]> {
    // TODO: Replace with actual API call
    return Promise.resolve(mockOrders);
  },

  async updateOrderStatus(_orderId: string, _status: string): Promise<void> {
    void _orderId;
    void _status;
    // TODO: Replace with actual API call
    return Promise.resolve();
  },

  // Customers
  async getCustomers(): Promise<AdminCustomer[]> {
    // TODO: Replace with actual API call
    return Promise.resolve(mockCustomers);
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    // TODO: Replace with actual API call
    return Promise.resolve(mockSuppliers);
  },

  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    // TODO: Replace with actual API call
    return Promise.resolve({ ...supplier, id: `SUP-${Date.now()}` });
  },

  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    // TODO: Replace with actual API call
    return Promise.resolve({ ...mockSuppliers[0], ...supplier, id });
  },

  async deleteSupplier(_id: string): Promise<void> {
    void _id;
    // TODO: Replace with actual API call
    return Promise.resolve();
  },

  // Zalo Reminders
  async getZaloReminders(): Promise<ZaloReminder[]> {
    // TODO: Replace with actual API call
    return Promise.resolve(mockZaloReminders);
  },

  async sendZaloReminder(_reminderId: string): Promise<void> {
    void _reminderId;
    // TODO: Replace with actual API call
    return Promise.resolve();
  },

  async sendBulkZaloReminders(_reminderIds: string[]): Promise<void> {
    void _reminderIds;
    // TODO: Replace with actual API call
    return Promise.resolve();
  },
};
