import { AlertTriangle, Info, Package, ShoppingCart, Star } from 'lucide-react';
import { Button } from '../ui/button';

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
  type: 'low_stock' | 'pending_order' | 'new_review' | 'system' | 'other';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface AlertsPanelProps {
  alerts: SystemAlert[];
  isLoading?: boolean;
  onAlertAction?: (alert: SystemAlert) => void;
}

const alertConfig = {
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
  other: { 
    icon: Info, 
    bgColor: 'bg-gray-50', 
    iconColor: 'text-gray-600',
    borderColor: 'border-gray-200'
  },
};

export function AlertsPanel({ alerts, isLoading = false, onAlertAction }: AlertsPanelProps) {
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

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const config = alertConfig[alert.type] || alertConfig.other;
        const Icon = config.icon;

        return (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:shadow-sm`}
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
