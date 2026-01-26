import { Card, CardContent } from '../ui/card';

// Stats card skeleton
export function StatsCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </CardContent>
        </Card>
    );
}

// Chart skeleton
export function ChartSkeleton({ height = 'h-72' }: { height?: string }) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                <div className={`${height} bg-gray-100 rounded-lg animate-pulse flex items-center justify-center`}>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Đang tải...</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Full dashboard skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Date filter skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Stats cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-6">
                <ChartSkeleton height="h-72" />
                <ChartSkeleton height="h-72" />
            </div>

            {/* More charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <ChartSkeleton height="h-64" />
                <ChartSkeleton height="h-64" />
            </div>

            {/* Bottom panels */}
            <div className="grid lg:grid-cols-3 gap-6">
                <ChartSkeleton height="h-80" />
                <ChartSkeleton height="h-80" />
                <ChartSkeleton height="h-80" />
            </div>
        </div>
    );
}
