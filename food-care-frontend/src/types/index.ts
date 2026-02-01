// Type definitions
export type UserRole = 'Customer' | 'Admin';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'returned';

export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export type SubscriptionFrequency = 'Weekly' | 'BiWeekly' | 'Monthly' | 'Custom';

export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled';

// Product Request Types
export interface CreateProductRequest {
    name: string;
    description?: string;
    basePrice: number;
    originalPrice?: number;
    sku?: string;
    stockQuantity: number;
    categoryId?: number;
    supplierId?: number;
    isSubscriptionAvailable: boolean;
    images: string[];
}

export interface UpdateProductRequest {
    name?: string;
    description?: string;
    basePrice?: number;
    originalPrice?: number;
    sku?: string;
    stockQuantity?: number;
    categoryId?: number;
    isSubscriptionAvailable?: boolean;
    isActive?: boolean;
    images: string[];
}

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
    categoryId?: number | string;
    categoryName?: string;
    description?: string;
    basePrice: number; // Changed from price
    originalPrice?: number;
    unit?: string; // Made optional
    stockQuantity: number;
    imageUrl?: string;
    images: string[];
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

export interface CartItem {
    product: Product;
    quantity: number;
    selected: boolean;
    isSubscription: boolean;
    subscription?: {
        frequency: SubscriptionFrequency;
        discount: number;
    };
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
    isReviewed?: boolean;
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
    shippingAddressSnapshot?: string;
    paymentMethodSnapshot?: string;
    items: OrderItem[];
    createdAt: string;
}
export interface VariantSnapshot {
    isSubscription: boolean;
    subscription?: {
        frequency: string;
    };
}


export interface CreateOrderItemRequest {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    variantSnapshot: VariantSnapshot;
}


export interface CreateOrderRequest {
    userId: string;
    shippingAddress: string;
    recipientName?: string;
    phoneNumber?: string;
    paymentMethod: string;
    note?: string;
    items: CreateOrderItemRequest[];
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

export interface Supplier {
    id: number | string; // Support both number and string
    name: string;
    products?: string[];
    totalProducts?: number;
    status?: 'active' | 'inactive';
    phone?: string;
    email?: string;
    address?: string;
    contact?: string;
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

// Admin Types
export interface AdminStats {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    monthlyGrowth: number;
    activeSubscriptions: number;
}

export interface AdminOrder {
    id: string;
    customerName: string;
    date: string;
    total: number;
    status: 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
    items: number;
    subscription: boolean;
    products: string[];
    address: string;
    phone: string;
}

export interface AdminCustomer {
    id: string;
    name: string;
    email: string;
    phone: string;
    memberTier: string;
    totalOrders: number;
    totalSpent: number;
    joinDate: string;
    subscriptions: number;
}

export interface ZaloReminder {
    id: string;
    customerName: string;
    phone: string;
    product: string;
    estimatedDaysLeft: number;
    lastPurchase: string;
    status: 'pending' | 'sent';
    sentDate?: string;
}

export interface Review {
    id: string;
    userName: string;
    userAvatar: string | null;
    rating: number;
    comment: string;
    images: string[];
    createdAt: string;
    helpfulCount: number;
    isVerifiedPurchase: boolean;
    isHelpfulByCurrentUser?: boolean;
}

export interface RatingDistributionItem {
    stars: number;
    count: number;
    percentage: number;
}

export interface ReviewResponse {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        stars: number;
        count: number;
        percentage: number;
    }[];
    reviews: Review[];
}

export interface ReviewEligibility {
    canReview: boolean;
    reason?: string;
}

// Payment Request/Response Types
export interface CreatePaymentRequest {
    orderId: string;
}

export interface PayOsCreateLinkResponse {
    checkoutUrl: string;
    paymentLinkId: string;
}