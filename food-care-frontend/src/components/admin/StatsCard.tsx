import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BreakdownItem {
  label: string;
  value: number;
  color: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor?: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  sparklineData?: number[];
  breakdown?: BreakdownItem[];
  onClick?: () => void;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor = 'bg-gray-100',
  subtitle,
  trend,
  sparklineData,
  breakdown,
  onClick,
  isLoading = false,
}: StatsCardProps) {
  const chartData = sparklineData?.map((val, idx) => ({ idx, value: val })) || [];

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
      role={onClick ? 'button' : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-10 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`sparkGradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={() => null} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.5} fill={`url(#sparkGradient-${title.replace(/\s/g, '')})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {breakdown && breakdown.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600">{item.label}:</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
