// Type definitions
export type UserRole = 'Customer' | 'Admin';

export type OrderStatus = 'Pending' | 'Processing' | 'Shipping' | 'Delivered' | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Paid' | 'Failed' | 'Refunded';

export type SubscriptionFrequency = 'Weekly' | 'BiWeekly' | 'Monthly' | 'Custom';

export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled';

// Auth Types
export interface MemberTier {
    id: number;
    name: string;
    nameVi: string;
    discountPercent: number;
    freeShippingThreshold?: number;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    role: string;
    memberTier?: MemberTier;
    totalSpent: number;
    loyaltyPoints: number;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
}

// Product Types
export interface Product {
    id: string;
    sku: string;
    name: string;
    slug: string;
    categoryId?: number;
    categoryName?: string;
    description?: string;
    price: number;
    originalPrice?: number;
    unit: string;
    stockQuantity: number;
    imageUrl?: string;
    images?: string[];
    ratingAverage: number;
    ratingCount: number;
    isSubscriptionAvailable: boolean;
    subscriptionDiscounts?: Record<string, number>;
    isActive: boolean;
}

export interface ProductFilter {
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
    isSubscriptionAvailable?: boolean;
    sortBy?: string;
    sortDescending?: boolean;
    page?: number;
    pageSize?: number;
}

export interface ProductsResponse {
    data: Product[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Cart Types
export interface CartItem {
    product: Product;
    quantity: number;
    isSubscription: boolean;
    subscriptionFrequency?: SubscriptionFrequency;
}

// Order Types
export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isSubscription: boolean;
    subscriptionFrequency?: SubscriptionFrequency;
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    subtotal: number;
    discountAmount: number;
    memberDiscountAmount: number;
    subscriptionDiscountAmount: number;
    shippingFee: number;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    isSubscriptionOrder: boolean;
    items: OrderItem[];
    createdAt: string;
}

// Subscription Types
export interface Subscription {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    productImageUrl?: string;
    frequency: SubscriptionFrequency;
    quantity: number;
    discountPercent: number;
    status: SubscriptionStatus;
    nextDeliveryDate: string;
    pauseUntil?: string;
    deliveryCount: number;
    createdAt: string;
}

export interface CreateSubscription {
    productId: string;
    frequency: SubscriptionFrequency;
    quantity: number;
    shippingAddressId: string;
    paymentMethodId: string;
}

// Category Types
export interface Category {
    id: number;
    name: string;
    slug: string;
    imageUrl?: string;
    parentId?: number;
}
