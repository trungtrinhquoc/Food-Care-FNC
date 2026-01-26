import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FulfillmentMetrics } from '../../types/supplier';

interface OperationalChartsProps {
  metrics: FulfillmentMetrics;
}

export function OperationalCharts({ metrics }: OperationalChartsProps) {
  const COLORS = {
    new: '#f97316',
    confirmed: '#3b82f6',
    packed: '#a855f7',
    shipped: '#6366f1',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  const PIE_COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Orders by Status */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Đơn hàng theo trạng thái</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.ordersByStatus}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="status" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {metrics.ordersByStatus.map((entry, index) => {
                const status = entry.status.toLowerCase().replace(' ', '_');
                const color = COLORS[status as keyof typeof COLORS] || '#6b7280';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {metrics.ordersByStatus.slice(0, 6).map((item) => {
            const status = item.status.toLowerCase().replace(' ', '_');
            const color = COLORS[status as keyof typeof COLORS] || '#6b7280';
            return (
              <div key={item.status} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-700">{item.status}: <span className="font-medium">{item.count}</span></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Average Fulfillment Time */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Thời gian xử lý trung bình (giờ)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.avgFulfillmentTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)} giờ`, 'Thời gian']}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-between px-2">
          <div>
            <p className="text-sm text-gray-600">Trung bình</p>
            <p className="text-xl font-semibold text-blue-600">
              {(metrics.avgFulfillmentTime.reduce((acc, curr) => acc + curr.hours, 0) / metrics.avgFulfillmentTime.length).toFixed(1)} giờ
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Mục tiêu</p>
            <p className="text-xl font-semibold text-gray-900">≤ 4.0 giờ</p>
          </div>
        </div>
      </div>

      {/* Shipping Success Rate */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Tỷ lệ giao hàng thành công</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={metrics.shippingSuccess}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, value }) => `${category}: ${value.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {metrics.shippingSuccess.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {metrics.shippingSuccess.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                <span className="text-sm font-medium">{item.category === 'Success' ? 'Giao thành công' : 'Giao thất bại'}</span>
              </div>
              <span className="text-sm font-semibold">{item.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Insights & Recommendations</h3>
        <div className="space-y-3">
          {metrics.shippingSuccess[0].value >= 95 ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">✓ Tỷ lệ giao hàng xuất sắc</p>
              <p className="text-xs text-green-700 mt-1">Duy trì chất lượng dịch vụ hiện tại</p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-900">⚠ Cần cải thiện tỷ lệ giao hàng</p>
              <p className="text-xs text-yellow-700 mt-1">Kiểm tra quy trình đóng gói và vận chuyển</p>
            </div>
          )}

          {metrics.avgFulfillmentTime.some((day) => day.hours > 5) ? (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-900">⚠ Thời gian xử lý chậm một số ngày</p>
              <p className="text-xs text-orange-700 mt-1">Tối ưu hóa quy trình đóng gói vào ngày cao điểm</p>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">✓ Thời gian xử lý tốt</p>
              <p className="text-xs text-blue-700 mt-1">Tiếp tục duy trì hiệu suất</p>
            </div>
          )}

          {metrics.ordersByStatus.find((s) => s.status === 'New')?.count || 0 > 10 ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">⚠ Nhiều đơn hàng chưa xác nhận</p>
              <p className="text-xs text-red-700 mt-1">Xác nhận đơn hàng mới để tránh delay</p>
            </div>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">✓ Xử lý đơn hàng mới kịp thời</p>
              <p className="text-xs text-green-700 mt-1">Đơn hàng được xác nhận nhanh chóng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
