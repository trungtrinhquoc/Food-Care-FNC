import axios from "axios";
import type { ReviewResponse, ReviewEligibility } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5022/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // nếu BE dùng cookie / auth
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const reviewApi = {
    getReviews(productId: string, page: number = 1, pageSize: number = 5): Promise<ReviewResponse> {
        return api
            .get(`/products/${productId}/reviews?pageIndex=${page}&pageSize=${pageSize}`)
            .then(res => res.data);
    },

    getEligibility(productId: string): Promise<ReviewEligibility> {
        return api
            .get(`/products/${productId}/reviews/eligibility`)
            .then(res => res.data);
    },

    createReview(payload: {
        productId: string;
        rating: number;
        comment: string;
        images?: string[];
        orderId?: string;
    }) {
        return api.post("/reviews", payload);
    },

    markHelpful(reviewId: string) {
        return api.post(`/reviews/${reviewId}/helpful`);
    },
};
