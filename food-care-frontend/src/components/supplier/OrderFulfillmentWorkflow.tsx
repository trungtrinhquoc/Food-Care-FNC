import { ArrowRight, CheckCircle, Package, Truck, X } from 'lucide-react';
import { OrderStatus } from '../../types/supplier';

interface OrderFulfillmentWorkflowProps {
  currentStatus: OrderStatus;
}

export function OrderFulfillmentWorkflow({ currentStatus }: OrderFulfillmentWorkflowProps) {
  const steps = [
    { status: 'new', label: 'Mới', icon: Package, color: 'orange' },
    { status: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle, color: 'blue' },
    { status: 'packed', label: 'Đã đóng gói', icon: Package, color: 'purple' },
    { status: 'shipped', label: 'Đang giao', icon: Truck, color: 'indigo' },
    { status: 'delivered', label: 'Đã giao', icon: CheckCircle, color: 'green' },
  ];

  const getCurrentStepIndex = () => {
    if (currentStatus === 'cancelled') return -1;
    return steps.findIndex((step) => step.status === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center justify-center gap-3 p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <X className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="font-medium text-red-900">Đơn hàng đã hủy</p>
          <p className="text-sm text-red-700">Đơn hàng này đã bị hủy bỏ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold mb-6">Quy trình xử lý đơn hàng</h3>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          const colorClasses = {
            orange: {
              bg: 'bg-orange-500',
              bgLight: 'bg-orange-100',
              text: 'text-orange-600',
              border: 'border-orange-500',
            },
            blue: {
              bg: 'bg-blue-500',
              bgLight: 'bg-blue-100',
              text: 'text-blue-600',
              border: 'border-blue-500',
            },
            purple: {
              bg: 'bg-purple-500',
              bgLight: 'bg-purple-100',
              text: 'text-purple-600',
              border: 'border-purple-500',
            },
            indigo: {
              bg: 'bg-indigo-500',
              bgLight: 'bg-indigo-100',
              text: 'text-indigo-600',
              border: 'border-indigo-500',
            },
            green: {
              bg: 'bg-green-500',
              bgLight: 'bg-green-100',
              text: 'text-green-600',
              border: 'border-green-500',
            },
          };

          const colors = colorClasses[step.color as keyof typeof colorClasses];

          return (
            <div key={step.status} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? `${colors.bg} border-transparent`
                    : isCurrent
                    ? `${colors.bgLight} ${colors.border}`
                    : 'bg-white border-gray-300'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isCompleted ? 'text-white' : isCurrent ? colors.text : 'text-gray-400'
                  }`}
                />
              </div>
              <span
                className={`text-xs font-medium text-center whitespace-nowrap ${
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              {isCurrent && (
                <span className="text-xs text-gray-500 absolute -bottom-5 whitespace-nowrap">
                  Bước hiện tại
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <ArrowRight className="w-4 h-4 text-blue-600" />
        <span>
          Bước tiếp theo:{' '}
          <span className="font-medium text-blue-600">
            {currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1].label : 'Hoàn tất'}
          </span>
        </span>
      </div>
    </div>
  );
}
