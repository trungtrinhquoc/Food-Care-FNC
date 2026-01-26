import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface CategoryRevenue {
  categoryName: string;
  revenue: number;
  orderCount: number;
  color: string;
}

interface CategoryRevenueChartProps {
  data: CategoryRevenue[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: CategoryRevenue }> }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-900 mb-1">{data.categoryName}</p>
      <p className="text-xs text-gray-600">Doanh thu: <span className="font-semibold">{data.revenue.toLocaleString('vi-VN')}đ</span></p>
      <p className="text-xs text-gray-600">Đơn hàng: <span className="font-semibold">{data.orderCount.toLocaleString()}</span></p>
    </div>
  );
}

export function CategoryRevenueChart({ data, isLoading = false }: CategoryRevenueChartProps) {
  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-gray-500">Chưa có dữ liệu doanh thu theo danh mục</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ categoryName, percent }: any) => `${categoryName}: ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={true}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((category, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="text-gray-700">{category.categoryName}</span>
            </div>
            <div className="text-right">
              <div className="text-gray-900 font-semibold">{category.revenue.toLocaleString('vi-VN')}đ</div>
              <div className="text-xs text-gray-500">
                {category.orderCount} đơn ({((category.revenue / total) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
