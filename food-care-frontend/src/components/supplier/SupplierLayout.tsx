import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SupplierSidebar } from './SupplierSidebar';
import { Loader2 } from 'lucide-react';

interface SupplierLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    badges?: Record<string, number>;
}

export function SupplierLayout({
    children,
    activeTab,
    onTabChange,
    badges = {}
}: SupplierLayoutProps) {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
            {/* Sidebar */}
            <SupplierSidebar
                activeTab={activeTab}
                onTabChange={onTabChange}
                badges={badges}
                onLogout={logout}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}

// Loading skeleton component for sections
export function SectionSkeleton() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-500">Đang tải...</p>
            </div>
        </div>
    );
}

// Empty state component
export function EmptyState({
    icon: Icon,
    title,
    description,
    action
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-4">{description}</p>
            {action}
        </div>
    );
}

// Section header component
export function SectionHeader({
    title,
    description,
    actions
}: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {description && (
                    <p className="text-gray-500 mt-1">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}

// Stat card with sparkline support
export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    className = ""
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    className?: string;
}) {
    const trendColors = {
        up: 'text-emerald-600 bg-emerald-50',
        down: 'text-red-600 bg-red-50',
        neutral: 'text-gray-600 bg-gray-50'
    };

    return (
        <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend && trendValue && (
                        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${trendColors[trend]}`}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                            {trendValue}
                        </div>
                    )}
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    );
}
