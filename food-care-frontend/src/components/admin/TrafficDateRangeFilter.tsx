import { } from 'react'; // Keep React if needed for JSX

export type TrafficDateRange = '1d' | '7d' | '30d' | '1y';

interface TrafficDateRangeFilterProps {
  value: TrafficDateRange;
  onChange: (range: TrafficDateRange) => void;
  className?: string;
}

const ranges: { value: TrafficDateRange; label: string }[] = [
  { value: '1d', label: '1 ngày' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '1 tháng' },
  { value: '1y', label: '1 năm' },
];

export function TrafficDateRangeFilter({ value, onChange, className = '' }: TrafficDateRangeFilterProps) {
  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg ${className}`}>
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${value === range.value
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
              : 'text-gray-700 hover:bg-white hover:text-orange-600'
            }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
