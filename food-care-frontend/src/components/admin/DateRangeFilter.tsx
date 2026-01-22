import { useState, useCallback } from 'react';

export type DateRange = '7d' | '30d' | '6m' | '1y';

interface DateRangeFilterProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
}

const ranges: { value: DateRange; label: string }[] = [
    { value: '7d', label: '7 ngày' },
    { value: '30d', label: '30 ngày' },
    { value: '6m', label: '6 tháng' },
    { value: '1y', label: '1 năm' },
];

export function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
    const [focusedIndex, setFocusedIndex] = useState<number>(
        ranges.findIndex((r) => r.value === value)
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            let newIndex = focusedIndex;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                newIndex = (focusedIndex + 1) % ranges.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                newIndex = (focusedIndex - 1 + ranges.length) % ranges.length;
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(ranges[focusedIndex].value);
                return;
            }

            if (newIndex !== focusedIndex) {
                setFocusedIndex(newIndex);
            }
        },
        [focusedIndex, onChange]
    );

    return (
        <div
            className={`inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg ${className}`}
            role="tablist"
            aria-label="Chọn khoảng thời gian"
        >
            {ranges.map((range, idx) => {
                const isActive = value === range.value;
                const isFocused = focusedIndex === idx;

                return (
                    <button
                        key={range.value}
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isFocused ? 0 : -1}
                        className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1
              ${isActive
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }
            `}
                        onClick={() => {
                            onChange(range.value);
                            setFocusedIndex(idx);
                        }}
                        onFocus={() => setFocusedIndex(idx)}
                        onKeyDown={handleKeyDown}
                    >
                        {range.label}
                    </button>
                );
            })}
        </div>
    );
}
