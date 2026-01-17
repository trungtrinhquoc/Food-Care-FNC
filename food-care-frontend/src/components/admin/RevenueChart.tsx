import { Card, CardContent } from '../ui/card';
import type { RevenueData } from '../../types/admin';

interface RevenueChartProps {
  data: RevenueData[];
  maxRevenue?: number;
}

export function RevenueChart({ data, maxRevenue = 30000000 }: RevenueChartProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.month} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-600">{item.month}</div>
              <div className="flex-1">
                <div className="h-8 bg-emerald-100 rounded-lg relative overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 flex items-center justify-end pr-2"
                    style={{
                      width: `${(item.revenue / maxRevenue) * 100}%`,
                    }}
                  >
                    <span className="text-xs text-white font-medium">
                      {item.revenue.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
