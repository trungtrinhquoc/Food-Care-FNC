import axios from 'axios';
import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
    ProductsResponse,
    ProductFilter,
    Product,
    Category,
    CreateProductRequest,
    UpdateProductRequest,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5022/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
function parseImageUrl(imageUrl?: string | string[]): string[] {
    if (!imageUrl) return []

    // ✅ Backend trả sẵn array
    if (Array.isArray(imageUrl)) return imageUrl

    // ✅ Backend trả string thường (1 ảnh)
    if (typeof imageUrl === 'string' && !imageUrl.startsWith('[')) {
        return [imageUrl]
    }

    // ✅ Backend trả JSON string
    try {
        const parsed = JSON.parse(imageUrl)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}
// Products API
export const productsApi = {
    getProducts: async (filter = {}): Promise<ProductsResponse> => {
        const response = await api.get<ProductsResponse>('/products', {
            params: filter,
        })

        return {
            ...response.data,
            products: response.data.products.map((p) => ({
                ...p,
                images: parseImageUrl(p.imageUrl) ?? [],
            })),
        }
    },

    getProduct: async (id: string): Promise<Product> => {
        const response = await api.get<any>(`/products/${id}`)
        const images = parseImageUrl(response.data.imageUrl)

        return {
            ...response.data,
            images,
            imageUrl: images[0] ?? undefined, // ⭐ QUAN TRỌNG
        }
    },
    // ===== NEW =====
    createProduct: async (
        data: CreateProductRequest
    ): Promise<Product> => {
        const response = await api.post<Product>('/products', data)
        return response.data
    },

    updateProduct: async (
        productId: string,
        data: UpdateProductRequest
    ): Promise<Product> => {
        const response = await api.put<Product>(
            `/products/${productId}`,
            data
        )
        return response.data
    },

    deleteProduct: async (productId: string): Promise<void> => {
        await api.delete(`/products/${productId}`)
    },

};

