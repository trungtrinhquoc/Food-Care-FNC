import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardCheck,
  Warehouse,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
  Undo2,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/staff',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Receiving',
    href: '/staff/receiving',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    title: 'Inventory',
    href: '/staff/inventory',
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: 'Warehouses',
    href: '/staff/warehouses',
    icon: <Warehouse className="h-5 w-5" />,
  },
  {
    title: 'Inspections',
    href: '/staff/inspections',
    icon: <ClipboardCheck className="h-5 w-5" />,
  },
  {
    title: 'Discrepancies',
    href: '/staff/discrepancies',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    title: 'Returns',
    href: '/staff/returns',
    icon: <Undo2 className="h-5 w-5" />,
  },
  {
    title: 'Reports',
    href: '/staff/reports',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: 'Staff Management',
    href: '/staff/members',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: 'Settings',
    href: '/staff/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export const StaffSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      {/* Logo/Title */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-primary">FoodCare Staff</h2>
        <p className="text-sm text-muted-foreground">Warehouse Management</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/staff' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.icon}
              <span>{item.title}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h4 className="font-medium text-sm mb-3">Quick Stats</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending Receipts</span>
            <span className="font-medium">5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">In Transit</span>
            <span className="font-medium">8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Low Stock Items</span>
            <span className="font-medium text-orange-600">12</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSidebar;
