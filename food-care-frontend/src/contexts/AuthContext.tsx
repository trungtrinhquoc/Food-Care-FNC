import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: LoginRequest) => Promise<AuthResponse>;
    register: (data: RegisterRequest) => Promise<AuthResponse>;
    loginWithGoogle: (credentialToken: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const handleAuthResponse = (response: AuthResponse) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
    };

    const login = async (data: LoginRequest) => {
        const response = await authApi.login(data);
        handleAuthResponse(response);
        return response;
    };

    const register = async (data: RegisterRequest) => {
        const response = await authApi.register(data);
        handleAuthResponse(response);
        return response;
    };

    const loginWithGoogle = async (credentialToken: string) => {
        try {
            const response = await authApi.googleAuth(credentialToken);
            handleAuthResponse(response);
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const updatedUser = await authApi.getCurrentUser();
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role?.toLowerCase() === 'admin',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
