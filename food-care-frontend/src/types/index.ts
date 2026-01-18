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
    phoneNumber?: string; // Changed from phone
    avatarUrl?: string;
    role: 'customer' | 'admin';
    memberTier?: MemberTier;
    totalSpent?: number; // Optional as not in DTO yet
    loyaltyPoints: number;
    createdAt?: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string; // Changed from phone
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
    basePrice: number; // Changed from price
    originalPrice?: number;
    unit?: string; // Made optional
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
    products: Product[]; // Changed from data
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

// Address Types
export interface Address {
    id: string;
    recipientName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district?: string;
    ward?: string;
    isDefault: boolean;
    createdAt?: string;
}

// Payment Method Types
export type PaymentMethodType = 'card' | 'momo' | 'zalopay' | 'bank';

export interface PaymentMethod {
    id: string;
    provider: string;
    last4Digits?: string;
    expiryDate?: string;
    isDefault: boolean;
    createdAt?: string;
}


