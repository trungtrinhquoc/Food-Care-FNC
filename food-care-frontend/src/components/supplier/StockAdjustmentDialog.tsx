import { useState } from 'react';
import { X, Plus, Minus, Save } from 'lucide-react';
import type { SupplierProduct } from '../../types/supplier';

interface StockAdjustmentDialogProps {
  product: SupplierProduct;
  onClose: () => void;
  onSave: (newQuantity: number) => void;
}

export function StockAdjustmentDialog({ product, onClose, onSave }: StockAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState(0);
  const [note, setNote] = useState('');

  const newStock = adjustmentType === 'add' 
    ? (product.stockQuantity || 0) + quantity 
    : Math.max(0, (product.stockQuantity || 0) - quantity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert('Vui lòng nhập số lượng hợp lệ');
      return;
    }
    onSave(newStock);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Điều chỉnh tồn kho</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
              <p className="text-sm text-gray-600">Tồn kho hiện tại: <span className="font-semibold">{product.stock}</span></p>
            </div>
          </div>

          {/* Adjustment type */}
          <div>
            <label className="block text-sm font-medium mb-2">Loại điều chỉnh</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  adjustmentType === 'add'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Nhập kho
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('remove')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  adjustmentType === 'remove'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Minus className="w-5 h-5 inline mr-2" />
                Xuất kho
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Số lượng {adjustmentType === 'add' ? 'nhập' : 'xuất'}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
              min="1"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2">Ghi chú (tùy chọn)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={adjustmentType === 'add' ? 'VD: Nhập từ nhà cung cấp' : 'VD: Hàng hỏng, trả lại'}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Preview */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Tồn kho sau điều chỉnh:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{product.stockQuantity}</span>
                <span className="text-gray-400">→</span>
                <span className={`text-xl font-semibold ${
                  newStock <= (product.minStock || 10) ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {newStock}
                </span>
              </div>
            </div>
            {newStock <= (product.minStock || 10) && (
              <p className="text-xs text-red-600 mt-2">
                ⚠ Cảnh báo: Tồn kho sẽ thấp hơn mức tối thiểu ({product.minStock || 10})
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 ${
                adjustmentType === 'add' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Save className="w-4 h-4" />
              Xác nhận điều chỉnh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
