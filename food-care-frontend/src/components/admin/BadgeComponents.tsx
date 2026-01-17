import { Badge } from '../ui/badge';
import { ORDER_STATUS_CONFIG, MEMBER_TIER_CONFIG, STOCK_THRESHOLDS, REMINDER_DAY_THRESHOLDS } from '../../constants/admin';
import type { OrderStatus, MemberTier } from '../../types/admin';

interface StatusBadgeProps {
  status: OrderStatus | 'sent' | 'active';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status] || { label: status, className: 'bg-gray-500' };
  return <Badge className={config.className}>{config.label}</Badge>;
}

interface TierBadgeProps {
  tier: MemberTier;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const className = MEMBER_TIER_CONFIG[tier];
  return <Badge className={className}>{tier}</Badge>;
}

interface StockBadgeProps {
  stock: number;
}

export function StockBadge({ stock }: StockBadgeProps) {
  const className =
    stock < STOCK_THRESHOLDS.CRITICAL
      ? 'bg-red-500'
      : stock < STOCK_THRESHOLDS.LOW
        ? 'bg-yellow-500'
        : 'bg-green-500';
  
  return <Badge className={className}>{stock}</Badge>;
}

interface ReminderDaysBadgeProps {
  days: number;
}

export function ReminderDaysBadge({ days }: ReminderDaysBadgeProps) {
  const className =
    days <= REMINDER_DAY_THRESHOLDS.URGENT
      ? 'bg-red-500'
      : days <= REMINDER_DAY_THRESHOLDS.WARNING
        ? 'bg-orange-500'
        : 'bg-yellow-500';
  
  return <Badge className={className}>~{days} ngày</Badge>;
}
