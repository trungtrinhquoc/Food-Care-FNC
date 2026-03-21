import { AlertTriangle, Info, Package, ShoppingCart, Star, CheckCheck, Eye } from 'lucide-react';
import { Button } from './Button';

function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (seconds < 60) return 'vài giây trước';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} ngày trước`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} tháng trước`;
  return `${Math.floor(seconds / 31536000)} năm trước`;
}

export interface SystemAlert {
  id: string;
  type: 'low_stock' | 'pending_order' | 'new_review' | 'system' | 'sla_violation' | 'quality_issue' | 'rating_drop' | 'return_rate' | 'other';
  severity: 'info' | 'warning' | 'error' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead?: boolean;
  storeName?: string;
  supplierId?: number;
}

interface AlertsPanelProps {
  alerts: SystemAlert[];
  isLoading?: boolean;
  onAlertAction?: (alert: SystemAlert) => void;
  onMarkAsRead?: (alertId: string) => void;
  onMarkAllAsRead?: () => void;
  unreadCount?: number;
}

const alertConfig: Record<string, { icon: typeof AlertTriangle; bgColor: string; iconColor: string; borderColor: string }> = {
  low_stock: { 
    icon: Package, 
    bgColor: 'bg-orange-50', 
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200'
  },
  pending_order: { 
    icon: ShoppingCart, 
    bgColor: 'bg-blue-50', 
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  new_review: { 
    icon: Star, 
    bgColor: 'bg-purple-50', 
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200'
  },
  system: { 
    icon: AlertTriangle, 
    bgColor: 'bg-red-50', 
    iconColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  sla_violation: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    borderColor: 'border-red-200'
  },
  quality_issue: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200'
  },
  rating_drop: {
    icon: Star,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-200'
  },
  return_rate: {
    icon: Package,
    bgColor: 'bg-red-50',
    iconColor: 'text-red-500',
    borderColor: 'border-red-200'
  },
  other: { 
    icon: Info, 
    bgColor: 'bg-gray-50', 
    iconColor: 'text-gray-600',
    borderColor: 'border-gray-200'
  },
};

export function AlertsPanel({ alerts, isLoading = false, onAlertAction, onMarkAsRead, onMarkAllAsRead, unreadCount }: AlertsPanelProps) {
  const handleAction = (alert: SystemAlert) => {
    if (onAlertAction) {
      onAlertAction(alert);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">Không có cảnh báo nào</p>
      </div>
    );
  }

  const unread = unreadCount ?? alerts.filter(a => !a.isRead).length;

  return (
    <div className="space-y-3">
      {/* Mark all as read header */}
      {unread > 0 && onMarkAllAsRead && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">{unread} chưa đọc</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      )}
      {alerts.map((alert) => {
        const config = alertConfig[alert.type] || alertConfig.other;
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:shadow-sm ${alert.isRead ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTimeAgo(alert.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{alert.message}</p>
                {alert.storeName && (
                  <p className="text-[10px] text-gray-400 mb-2">Mart: {alert.storeName}</p>
                )}
                <div className="flex items-center gap-2">
                  {alert.actionUrl && alert.actionLabel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(alert)}
                      className="h-7 text-xs"
                    >
                      {alert.actionLabel}
                    </Button>
                  )}
                  {!alert.isRead && onMarkAsRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(alert.id)}
                      className="h-7 text-xs gap-1 text-gray-500 hover:text-blue-600"
                    >
                      <Eye className="w-3 h-3" />
                      Đã đọc
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
