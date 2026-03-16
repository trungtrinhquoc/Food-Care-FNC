import api from './api';

export interface ShipperInfo {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
    employeeCode: string;
    warehouseId?: string;
    warehouseName?: string;
    warehouseAddress?: string;
    todayDelivered: number;
    todayPending: number;
    totalDelivered: number;
}

export interface ShipperStats {
    todayTotal: number;
    todayDelivered: number;
    todayPending: number;
    todayShipping: number;
    weekTotal: number;
    weekDelivered: number;
    todayTotalAmount: number;
}

export interface ShipperOrderItem {
    productName: string;
    productImageUrl?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface ShipperOrder {
    id: string;
    status: string;
    statusLabel: string;
    totalAmount: number;
    shippingAddressSnapshot: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    note?: string;
    trackingNumber?: string;
    paymentStatus: string;
    paymentMethodSnapshot: string;
    createdAt?: string;
    updatedAt?: string;
    acceptedByShipperId?: string;
    items: ShipperOrderItem[];
}

export interface ShippingAddress {
    recipientName?: string;
    fullName?: string;
    phoneNumber?: string;
    phone?: string;
    addressLine1?: string;
    address?: string;
    ward?: string;
    district?: string;
    city?: string;
}

export const parseShippingAddress = (snapshot: string): ShippingAddress => {
    try {
        return JSON.parse(snapshot) as ShippingAddress;
    } catch {
        return {};
    }
};

export const shipperApi = {
    getMyInfo: () => api.get<ShipperInfo>('/shipper/me').then(r => r.data),
    getStats: () => api.get<ShipperStats>('/shipper/stats').then(r => r.data),
    getOrders: (status?: string) =>
        api.get<ShipperOrder[]>('/shipper/orders', { params: status ? { status } : {} }).then(r => r.data),
    acceptOrder: (orderId: string) =>
        api.post<{ message: string }>(`/shipper/orders/${orderId}/accept`).then(r => r.data),
    updateStatus: (orderId: string, newStatus: string, note?: string) =>
        api.patch<{ message: string }>(`/shipper/orders/${orderId}/status`, { newStatus, note }).then(r => r.data),
};
