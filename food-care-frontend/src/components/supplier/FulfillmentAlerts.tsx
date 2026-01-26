import { AlertTriangle, Clock, Package, TrendingUp, X } from 'lucide-react';
import { Alert } from '../../types/supplier';

interface FulfillmentAlertsProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  onViewOrder: (orderId: string) => void;
}

export function FulfillmentAlerts({ alerts, onDismiss, onViewOrder }: FulfillmentAlertsProps) {
  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        badge: 'bg-red-600 text-white',
        label: 'Khẩn cấp',
      },
      high: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        badge: 'bg-orange-600 text-white',
        label: 'Quan trọng',
      },
      medium: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-600 text-white',
        label: 'Chú ý',
      },
      low: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        badge: 'bg-blue-600 text-white',
        label: 'Thông tin',
      },
    };
    return configs[severity as keyof typeof configs];
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'not_confirmed':
        return Clock;
      case 'not_shipped':
        return Package;
      case 'delayed':
        return AlertTriangle;
      case 'failed_delivery':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">Không có cảnh báo</h3>
            <p className="text-sm text-gray-600">Tất cả đơn hàng đang được xử lý tốt</p>
          </div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const highAlerts = alerts.filter((a) => a.severity === 'high');
  const otherAlerts = alerts.filter((a) => a.severity !== 'critical' && a.severity !== 'high');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold">Cảnh báo xử lý đơn hàng</h3>
              <p className="text-sm text-gray-600">
                {alerts.length} cảnh báo cần xử lý
                {criticalAlerts.length > 0 && (
                  <span className="text-red-600 font-medium ml-2">• {criticalAlerts.length} khẩn cấp</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-2">
        {/* Critical alerts first */}
        {criticalAlerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={`${config.bg} border ${config.border} rounded-lg p-4 animate-pulse`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${config.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 ${config.badge} text-xs font-medium rounded`}>
                        {config.label}
                      </span>
                      <span className="font-semibold text-sm">{alert.orderNumber}</span>
                      <span className="text-xs text-gray-600">• {formatTime(alert.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="p-1 hover:bg-white/50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-900 mb-3">{alert.message}</p>
                  <button
                    onClick={() => onViewOrder(alert.orderId)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Xem đơn hàng
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* High priority alerts */}
        {highAlerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={`${config.bg} border ${config.border} rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${config.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 ${config.badge} text-xs font-medium rounded`}>
                        {config.label}
                      </span>
                      <span className="font-semibold text-sm">{alert.orderNumber}</span>
                      <span className="text-xs text-gray-600">• {formatTime(alert.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="p-1 hover:bg-white/50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-900 mb-3">{alert.message}</p>
                  <button
                    onClick={() => onViewOrder(alert.orderId)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Xem đơn hàng
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Other alerts */}
        {otherAlerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={`${config.bg} border ${config.border} rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${config.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{alert.orderNumber}</span>
                      <span className="text-xs text-gray-600">• {formatTime(alert.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="p-1 hover:bg-white/50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                  <button
                    onClick={() => onViewOrder(alert.orderId)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Xem đơn hàng →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
