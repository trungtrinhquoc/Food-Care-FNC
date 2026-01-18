import * as React from "react"
import { cn } from "../../lib/utils"

// ============ Base Badge Component ============
export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
}

const variantStyles: Record<string, string> = {
    default: 'bg-gray-500 text-white',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                    variantStyles[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
StatusBadge.displayName = "StatusBadge"

// ============ Order Status Badge ============
import { ORDER_STATUS_CONFIG } from '../../constants/admin';
import type { OrderStatus } from '../../types/admin';

interface OrderStatusBadgeProps {
    status: OrderStatus | 'sent' | 'active';
}

function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const config = ORDER_STATUS_CONFIG[status] || { label: status, className: 'bg-gray-500' };
    return <StatusBadge className={config.className}>{config.label}</StatusBadge>;
}

// ============ Member Tier Badge ============
import { MEMBER_TIER_CONFIG } from '../../constants/admin';
import type { MemberTier } from '../../types/admin';

interface TierBadgeProps {
    tier: MemberTier;
}

function TierBadge({ tier }: TierBadgeProps) {
    const className = MEMBER_TIER_CONFIG[tier];
    return <StatusBadge className={className}>{tier}</StatusBadge>;
}

// ============ Stock Badge ============
import { STOCK_THRESHOLDS } from '../../constants/admin';

interface StockBadgeProps {
    stock: number;
}

function StockBadge({ stock }: StockBadgeProps) {
    const className =
        stock < STOCK_THRESHOLDS.CRITICAL
            ? 'bg-red-500'
            : stock < STOCK_THRESHOLDS.LOW
                ? 'bg-yellow-500'
                : 'bg-green-500';

    return <StatusBadge className={className}>{stock}</StatusBadge>;
}

// ============ Reminder Days Badge ============
import { REMINDER_DAY_THRESHOLDS } from '../../constants/admin';

interface ReminderDaysBadgeProps {
    days: number;
}

function ReminderDaysBadge({ days }: ReminderDaysBadgeProps) {
    const className =
        days <= REMINDER_DAY_THRESHOLDS.URGENT
            ? 'bg-red-500'
            : days <= REMINDER_DAY_THRESHOLDS.WARNING
                ? 'bg-orange-500'
                : 'bg-yellow-500';

    return <StatusBadge className={className}>~{days} ngày</StatusBadge>;
}

// ============ Supplier Status Badge ============
import type { SupplierStatus } from '../../types/admin';

interface SupplierStatusBadgeProps {
    status: SupplierStatus;
}

function SupplierStatusBadge({ status }: SupplierStatusBadgeProps) {
    const config = {
        active: { label: 'Hoạt động', className: 'bg-green-500' },
        inactive: { label: 'Ngừng hoạt động', className: 'bg-gray-500' },
    };
    const { label, className } = config[status] || config.inactive;
    return <StatusBadge className={className}>{label}</StatusBadge>;
}

export { 
    StatusBadge, 
    OrderStatusBadge, 
    TierBadge, 
    StockBadge, 
    ReminderDaysBadge,
    SupplierStatusBadge 
}
