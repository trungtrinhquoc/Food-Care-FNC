import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export interface TrafficSource {
  source: string;
  sessions: number;
  users: number;
  color: string;
}

interface TrafficChartProps {
  data: TrafficSource[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: TrafficSource }> }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-900 mb-1">{data.source}</p>
      <p className="text-xs text-gray-600">Phiên: <span className="font-semibold">{data.sessions.toLocaleString()}</span></p>
      <p className="text-xs text-gray-600">Người dùng: <span className="font-semibold">{data.users.toLocaleString()}</span></p>
    </div>
  );
}

export function TrafficChart({ data, isLoading = false }: TrafficChartProps) {
  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-gray-500">Chưa có dữ liệu lưu lượng truy cập</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.sessions, 0);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="sessions"
            nameKey="source"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
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
        {data.map((source, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
              <span className="text-gray-700">{source.source}</span>
            </div>
            <div className="text-gray-600">
              <span className="font-semibold">{source.sessions.toLocaleString()}</span>
              <span className="text-xs ml-1">({((source.sessions / total) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
