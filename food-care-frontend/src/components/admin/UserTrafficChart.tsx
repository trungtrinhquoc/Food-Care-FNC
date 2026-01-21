import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface UserTrafficData {
  date: string;
  activeUsers: number;
  newUsers: number;
  totalLogins: number;
}

interface UserTrafficChartProps {
  data: UserTrafficData[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-100">
      <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function UserTrafficChart({ data, isLoading = false }: UserTrafficChartProps) {
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
        <p className="text-gray-500">Chưa có dữ liệu lưu lượng truy cập</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Line 
            type="monotone" 
            dataKey="activeUsers" 
            name="Người dùng hoạt động"
            stroke="#f97316" 
            strokeWidth={2} 
            dot={{ r: 4, fill: '#f97316' }} 
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="newUsers" 
            name="Người dùng mới"
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={{ r: 4, fill: '#3b82f6' }} 
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="totalLogins" 
            name="Tổng lượt đăng nhập"
            stroke="#8b5cf6" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#8b5cf6' }} 
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
