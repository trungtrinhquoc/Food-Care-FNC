// Mart / Cart / Cross-mart search types

export interface NearbyMart {
    id: number;
    storeName: string;
    address: string;
    distanceKm: number;
    rating: number;
    productCount: number;
    isPreSelected: boolean;
    latitude: number;
    longitude: number;
}

export interface MartDetail {
    id: number;
    storeName: string;
    address: string;
    phone: string;
    email: string;
    rating: number;
    productCount: number;
    latitude: number;
    longitude: number;
    certifications: string[];
    operatingHours: string;
}

export interface MartProduct {
    id: string;
    name: string;
    basePrice: number;
    originalPrice?: number;
    imageUrl?: string;
    categoryName?: string;
    ratingAverage: number;
    stockQuantity: number;
    stockStatus: string;
    isSubscriptionAvailable: boolean;
}

export interface NearbyMartQuery {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    maxResults?: number;
}

export interface MartProductFilter {
    categoryId?: number;
    search?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
}

// Cross-mart search
export interface CrossMartSearchQuery {
    query: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    sortBy?: string;
    page?: number;
    pageSize?: number;
}

export interface CrossMartProductResult {
    productId: string;
    productName: string;
    basePrice: number;
    originalPrice?: number;
    imageUrl?: string;
    categoryName?: string;
    ratingAverage: number;
    stockQuantity: number;
    martId: number;
    martName: string;
    distanceKm: number;
    shippingDisplay: string;
    isFreeShipping: boolean;
}

export interface ProductVariant {
    productId: string;
    productName: string;
    basePrice: number;
    imageUrl?: string;
    ratingAverage: number;
    stockQuantity: number;
    isPopular: boolean;
}

export interface AlternativeMart {
    martId: number;
    martName: string;
    distanceKm: number;
    productPrice: number;
    stockQuantity: number;
    isFreeShipping: boolean;
}

// Server-side cart
export interface ServerCart {
    subscriptionItems: ServerCartItem[];
    oneTimeItems: ServerCartItem[];
    subtotal: number;
    shippingFee: number;
    freeShippingNote: string;
    total: number;
    walletBalance: number;
    walletAfterCheckout: number;
    canCheckout: boolean;
}

export interface ServerCartItem {
    id: string;
    productId: string;
    productName: string;
    productImageUrl?: string;
    basePrice: number;
    quantity: number;
    isSubscription: boolean;
    subscriptionFrequency?: string;
    lineTotal: number;
    isInActiveSubscription: boolean;
}

export interface AddToCartRequest {
    productId: string;
    quantity: number;
    isSubscription: boolean;
    subscriptionFrequency?: string;
}

export interface UpdateCartItemRequest {
    quantity: number;
}

export interface CartCheckoutResult {
    orderId: string;
    totalAmount: number;
    walletBefore: number;
    walletAfter: number;
}
