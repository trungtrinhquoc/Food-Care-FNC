import { CheckCircle, Printer, Download, RefreshCw } from 'lucide-react';

interface QuickActionsProps {
  newOrdersCount: number;
  onConfirmAllNew: () => void;
  onPrintPackingSlips: () => void;
  onExportShippingReport: () => void;
  onRefreshData: () => void;
}

export function QuickActions({
  newOrdersCount,
  onConfirmAllNew,
  onPrintPackingSlips,
  onExportShippingReport,
  onRefreshData,
}: QuickActionsProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold mb-4">Thao tác nhanh</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Confirm all new orders */}
        <button
          onClick={onConfirmAllNew}
          disabled={newOrdersCount === 0}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            newOrdersCount > 0
              ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300'
              : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              newOrdersCount > 0 ? 'bg-blue-600' : 'bg-gray-400'
            }`}>
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-0.5">Xác nhận tất cả</p>
              <p className="text-xs text-gray-600">
                {newOrdersCount > 0 ? `${newOrdersCount} đơn mới` : 'Không có đơn mới'}
              </p>
            </div>
          </div>
        </button>

        {/* Print packing slips */}
        <button
          onClick={onPrintPackingSlips}
          className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-0.5">In phiếu giao</p>
              <p className="text-xs text-gray-600">Đơn cần đóng gói</p>
            </div>
          </div>
        </button>

        {/* Export shipping report */}
        <button
          onClick={onExportShippingReport}
          className="p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-0.5">Xuất báo cáo</p>
              <p className="text-xs text-gray-600">Vận chuyển hôm nay</p>
            </div>
          </div>
        </button>

        {/* Refresh data */}
        <button
          onClick={onRefreshData}
          className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-0.5">Làm mới dữ liệu</p>
              <p className="text-xs text-gray-600">Cập nhật realtime</p>
            </div>
          </div>
        </button>
      </div>

      {/* Keyboard shortcuts info */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-600 mb-2 font-medium">Phím tắt:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+A</kbd>
            <span className="text-gray-600">Chọn tất cả</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+P</kbd>
            <span className="text-gray-600">In phiếu</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+R</kbd>
            <span className="text-gray-600">Làm mới</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+E</kbd>
            <span className="text-gray-600">Xuất báo cáo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

