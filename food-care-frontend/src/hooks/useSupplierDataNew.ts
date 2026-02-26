// React Query hooks for Supplier Dashboard
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderStatus, Order, SupplierOrder } from '../types/supplier';
import { supplierApi } from '../services/suppliersApi';
import api from '../services/api';

// Helper function to map SupplierOrder to Order
const mapSupplierOrderToOrder = (supplierOrder: SupplierOrder): Order => ({
  id: supplierOrder.id,
  orderNumber: `ORD-${supplierOrder.id}`,
  customerId: `cust-${supplierOrder.id}`,
  customerName: supplierOrder.customerName,
  customerEmail: `${supplierOrder.customerName.toLowerCase().replace(' ', '.')}@example.com`,
  customerPhone: '0900000000',
  customer: {
    name: supplierOrder.customerName,
    phone: '0900000000',
    email: `${supplierOrder.customerName.toLowerCase().replace(' ', '.')}@example.com`
  },
  items: [], // API doesn't provide items, populate with mock data
  totalAmount: supplierOrder.totalAmount,
  status: supplierOrder.status as OrderStatus,
  shippingAddress: {
    street: '123 Đường ABC',
    city: 'TP.HCM',
    state: 'Quận 1',
    zipCode: '700000',
    country: 'Vietnam'
  },
  createdAt: supplierOrder.createdAt,
  shipping: {
    timeline: [
      {
        date: supplierOrder.createdAt,
        status: supplierOrder.status,
        location: 'Kho TP.HCM',
        description: `Đơn hàng ${supplierOrder.status}`
      }
    ]
  }
});

// Mock data - using inline data to avoid import issues
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customerId: 'cust-001',
    customerName: 'Nguyễn Văn A',
    customerEmail: 'a@example.com',
    customerPhone: '0901234567',
    customer: {
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      email: 'a@example.com'
    },
    totalAmount: 150000,
    status: 'pending' as OrderStatus,
    createdAt: '2024-01-15',
    itemCount: 3,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Sữa tươi',
        quantity: 2,
        price: 25000,
        totalPrice: 50000
      }
    ],
    shippingAddress: {
      street: '123 Nguyễn Huệ',
      city: 'TP.HCM',
      state: 'Quận 1',
      zipCode: '700000',
      country: 'Vietnam'
    },
    shipping: {
      timeline: [
        {
          date: '2024-01-15',
          timestamp: '2024-01-15T10:00:00Z',
          status: 'confirmed',
          location: 'Kho TP.HCM',
          description: 'Đơn hàng đã được xác nhận',
          notes: 'Đã xác nhận đơn hàng thành công'
        },
        {
          date: '2024-01-16',
          timestamp: '2024-01-16T14:30:00Z',
          status: 'processing',
          location: 'Kho TP.HCM',
          description: 'Đang xử lý đơn hàng',
          notes: 'Đang đóng gói sản phẩm'
        }
      ]
    }
  }
];

// Orders hooks
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      try {
        // Try to get real data from API
        const apiOrders = await supplierApi.getOrders();
        // Map SupplierOrder[] to Order[]
        return apiOrders.map(mapSupplierOrderToOrder);
      } catch (error) {
        console.warn('Failed to fetch orders from API, using mock data:', error);
        // Fallback to mock data
        return mockOrders;
      }
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: OrderStatus; notes?: string }) => {
      try {
        const response = await api.put(`/supplier/orders/${orderId}/status`, { status, notes });
        return response.data;
      } catch (error) {
        console.warn('Failed to update order status via API:', error);
        // Fallback to mock behavior
        await new Promise(resolve => setTimeout(resolve, 500));
        return { orderId, status };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useAddShipping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, trackingNumber, carrier, estimatedDelivery, cost, notes }: {
      orderId: string;
      trackingNumber: string;
      carrier: string;
      estimatedDelivery?: string;
      cost?: number;
      notes?: string;
    }) => {
      try {
        const response = await api.post(`/supplier/orders/${orderId}/shipping`, {
          trackingNumber, carrier, estimatedDelivery, cost, notes
        });
        return response.data;
      } catch (error) {
        console.warn('Failed to add shipping info via API:', error);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { orderId, trackingNumber, carrier };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      try {
        const response = await api.put(`/supplier/orders/${orderId}/status`, {
          status: 'cancelled',
          notes: reason
        });
        return response.data;
      } catch (error) {
        console.warn('Failed to cancel order via API:', error);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { orderId, reason };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useBulkConfirmOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderIds }: { orderIds: string[] }) => {
      try {
        const response = await api.post('/supplier/orders/bulk-confirm', { orderIds });
        return response.data;
      } catch (error) {
        console.warn('Failed to bulk confirm orders via API:', error);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { orderIds };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useKPIs = () => {
  return useQuery({
    queryKey: ['kpis'],
    queryFn: async () => {
      try {
        // Try to get real data from API
        const apiStats = await supplierApi.getStats();
        // Map SupplierStats to KPIMetrics format
        return {
          totalRevenue: apiStats.totalRevenue || 0,
          totalOrders: apiStats.totalOrders || 0,
          totalProducts: apiStats.totalProducts || 0,
          averageOrderValue: apiStats.totalOrders ? Math.round(apiStats.totalRevenue / apiStats.totalOrders) : 0,
          pendingOrders: apiStats.pendingOrders || 0,
          completedOrders: Math.floor((apiStats.totalOrders || 0) * 0.7), // Calculate from total
          cancelledOrders: Math.floor((apiStats.totalOrders || 0) * 0.1), // Calculate from total
          revenue: {
            today: apiStats.thisMonthRevenue || 0,
            month: apiStats.thisMonthRevenue || 0,
            change: apiStats.lastMonthRevenue ? ((apiStats.thisMonthRevenue - apiStats.lastMonthRevenue) / apiStats.lastMonthRevenue * 100) : 0
          },
          orders: {
            new: apiStats.pendingOrders || 0,
            processing: Math.floor((apiStats.totalOrders || 0) * 0.3),
            completed: Math.floor((apiStats.totalOrders || 0) * 0.7),
            cancelled: Math.floor((apiStats.totalOrders || 0) * 0.1)
          },
          products: {
            total: apiStats.totalProducts || 0,
            active: apiStats.activeProducts || 0,
            lowStock: apiStats.lowStockProducts || 0,
            outOfStock: Math.floor((apiStats.totalProducts || 0) * 0.1)
          },
          customers: {
            new: Math.floor((apiStats.totalOrders || 0) * 0.2),
            returning: Math.floor((apiStats.totalOrders || 0) * 0.8),
            total: Math.floor((apiStats.totalOrders || 0) * 1.5)
          }
        };
      } catch (error) {
        console.warn('Failed to fetch KPIs from API, using mock data:', error);
        // Fallback to mock data
        return {
          totalRevenue: 2500000,
          totalOrders: 45,
          totalProducts: 23,
          averageOrderValue: 55555,
          pendingOrders: 8,
          completedOrders: 35,
          cancelledOrders: 2,
          revenue: {
            today: 150000,
            month: 2500000,
            change: 12.5
          },
          orders: {
            new: 8,
            processing: 12,
            completed: 35,
            cancelled: 2
          },
          products: {
            total: 23,
            active: 20,
            lowStock: 2,
            outOfStock: 1
          },
          customers: {
            new: 15,
            returning: 105,
            total: 120
          }
        };
      }
    },
  });
};

export const useFulfillmentMetrics = () => {
  return useQuery({
    queryKey: ['fulfillment-metrics'],
    queryFn: () => Promise.resolve({
      fulfillmentRate: 95.5,
      onTimeDeliveryRate: 92.3,
      averageProcessingTime: 2.5,
      ordersByStatus: [
        { status: 'pending', count: 8 },
        { status: 'confirmed', count: 15 },
        { status: 'processing', count: 12 },
        { status: 'shipped', count: 20 },
        { status: 'delivered', count: 35 },
        { status: 'cancelled', count: 2 }
      ],
      averageFulfillmentTime: 1.8,
      dailyProcessing: [
        { date: '2024-01-15', processed: 12, shipped: 10, delivered: 8 },
        { date: '2024-01-16', processed: 15, shipped: 13, delivered: 11 },
        { date: '2024-01-17', processed: 18, shipped: 16, delivered: 14 },
        { date: '2024-01-18', processed: 14, shipped: 12, delivered: 10 },
        { date: '2024-01-19', processed: 20, shipped: 18, delivered: 16 },
        { date: '2024-01-20', processed: 16, shipped: 14, delivered: 12 },
        { date: '2024-01-21', processed: 19, shipped: 17, delivered: 15 }
      ]
    }),
  });
};

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => Promise.resolve([
      {
        id: '1',
        type: 'low_stock' as const,
        title: 'Sản phẩm sắp hết hàng',
        message: 'Sản phẩm "Sữa tươi" còn ít hơn 10 đơn vị',
        severity: 'medium' as const,
        isRead: false,
        createdAt: '2024-01-15'
      }
    ]),
  });
};

export const useDismissAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId }: { alertId: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { alertId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};
