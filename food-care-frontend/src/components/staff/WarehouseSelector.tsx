import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Warehouse } from 'lucide-react';
import type { Warehouse as WarehouseType } from '@/types/staff';

interface WarehouseSelectorProps {
  warehouses: WarehouseType[];
  value: string;
  onChange: (value: string) => void;
  showAllOption?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const WarehouseSelector: React.FC<WarehouseSelectorProps> = ({
  warehouses,
  value,
  onChange,
  showAllOption = true,
  placeholder = 'Select warehouse',
  className = 'w-[200px]',
  disabled = false,
}) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">All Warehouses</SelectItem>
        )}
        {warehouses.map((warehouse) => (
          <SelectItem key={warehouse.id} value={warehouse.id}>
            <div className="flex flex-col">
              <span>{warehouse.name}</span>
              {warehouse.addressCity && (
                <span className="text-xs text-muted-foreground">
                  {warehouse.addressCity}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default WarehouseSelector;
