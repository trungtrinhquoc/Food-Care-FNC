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
  customerEmail: supplierOrder.customerEmail || '',
  customerPhone: supplierOrder.customerPhone || '',
  customer: {
    name: supplierOrder.customerName,
    phone: supplierOrder.customerPhone || '',
    email: supplierOrder.customerEmail || ''
  },
  items: (supplierOrder.items || []).map(item => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    totalPrice: item.totalPrice
  })),
  totalAmount: supplierOrder.totalAmount,
  status: supplierOrder.status as OrderStatus,
  shippingAddress: supplierOrder.shippingAddress || {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Vietnam'
  },
  createdAt: supplierOrder.createdAt,
  shipping: {
    timeline: [
      {
        date: supplierOrder.createdAt,
        status: supplierOrder.status,
        location: '',
        description: `Đơn hàng ${supplierOrder.status}`
      }
    ]
  }
});

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
        console.warn('Failed to fetch orders from API:', error);
        return [];
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
        throw error;
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
        throw error;
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
        throw error;
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
        throw error;
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
          completedOrders: apiStats.completedOrders || 0,
          cancelledOrders: apiStats.cancelledOrders || 0,
          revenue: {
            today: apiStats.todayRevenue || 0,
            month: apiStats.thisMonthRevenue || 0,
            change: apiStats.lastMonthRevenue ? ((apiStats.thisMonthRevenue - apiStats.lastMonthRevenue) / apiStats.lastMonthRevenue * 100) : 0
          },
          orders: {
            new: apiStats.pendingOrders || 0,
            processing: apiStats.confirmedOrders || 0,
            completed: apiStats.completedOrders || 0,
            cancelled: apiStats.cancelledOrders || 0
          },
          products: {
            total: apiStats.totalProducts || 0,
            active: apiStats.activeProducts || 0,
            lowStock: apiStats.lowStockProducts || 0,
            outOfStock: apiStats.outOfStockProducts || 0
          },
          customers: {
            new: apiStats.pendingOrders || 0,
            returning: (apiStats.totalOrders || 0) - (apiStats.pendingOrders || 0),
            total: apiStats.totalOrders || 0
          }
        };
      } catch (error) {
        console.warn('Failed to fetch KPIs from API:', error);
        return {
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          averageOrderValue: 0,
          pendingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          revenue: {
            today: 0,
            month: 0,
            change: 0
          },
          orders: {
            new: 0,
            processing: 0,
            completed: 0,
            cancelled: 0
          },
          products: {
            total: 0,
            active: 0,
            lowStock: 0,
            outOfStock: 0
          },
          customers: {
            new: 0,
            returning: 0,
            total: 0
          }
        };
      }
    },
  });
};

export const useFulfillmentMetrics = () => {
  return useQuery({
    queryKey: ['fulfillment-metrics'],
    queryFn: async () => {
      try {
        const apiStats = await supplierApi.getStats();
        const totalOrders = apiStats.totalOrders || 0;
        const completedOrders = apiStats.completedOrders || 0;
        return {
          fulfillmentRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
          onTimeDeliveryRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
          averageProcessingTime: 0,
          ordersByStatus: [],
          averageFulfillmentTime: 0,
          dailyProcessing: []
        };
      } catch (error) {
        console.warn('Failed to fetch fulfillment metrics:', error);
        return {
          fulfillmentRate: 0,
          onTimeDeliveryRate: 0,
          averageProcessingTime: 0,
          ordersByStatus: [],
          averageFulfillmentTime: 0,
          dailyProcessing: []
        };
      }
    },
  });
};

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      try {
        const products = await supplierApi.getProducts();
        const alerts: { id: string; type: 'low_stock'; title: string; message: string; severity: 'medium' | 'high'; isRead: boolean; createdAt: string }[] = [];
        const productList = Array.isArray(products) ? products : [];
        productList.forEach((p: { id?: string; name?: string; stockQuantity?: number; lowStockThreshold?: number }) => {
          if (p.stockQuantity !== undefined && p.lowStockThreshold !== undefined && p.stockQuantity <= p.lowStockThreshold) {
            alerts.push({
              id: `low-stock-${p.id}`,
              type: 'low_stock',
              title: 'Sản phẩm sắp hết hàng',
              message: `"${p.name}" còn ${p.stockQuantity} đơn vị`,
              severity: p.stockQuantity === 0 ? 'high' : 'medium',
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        });
        return alerts;
      } catch (error) {
        console.warn('Failed to fetch alerts:', error);
        return [];
      }
    },
  });
};

export const useDismissAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId }: { alertId: string }) => {
      return { alertId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};
