import type { ReactNode } from 'react';
import { BarChart3, AlertCircle, Store, DollarSign } from 'lucide-react';

interface AdminBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingComplaints?: number;
  children: ReactNode;
}

const MOBILE_TABS = [
  { id: 'overview',    label: 'Tổng quan',  icon: BarChart3   },
  { id: 'complaints',  label: 'Khiếu nại',  icon: AlertCircle },
  { id: 'mart',        label: 'Mart',        icon: Store       },
  { id: 'finance',     label: 'Tài chính',   icon: DollarSign  },
] as const;

const TAB_LABELS: Record<string, string> = {
  overview:   'Admin tổng quan',
  complaints: 'Queue Khiếu nại',
  mart:       'Quản lý Mart',
  finance:    'Tài chính tổng hợp',
};

export function AdminBottomNav({
  activeTab,
  onTabChange,
  pendingComplaints = 0,
  children,
}: AdminBottomNavProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 sticky top-0 z-10 shadow-sm">
        <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          Admin
        </span>
        <h1 className="text-sm font-semibold text-gray-800">
          {TAB_LABELS[activeTab] ?? 'Dashboard'}
        </h1>
      </header>

      {/* Scrollable content with bottom padding for nav */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20 safe-area-inset-bottom">
        {MOBILE_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative ${
                isActive ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* Active indicator line */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-b-full" />
              )}

              {/* Icon + badge */}
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-400'}`} />
                {id === 'complaints' && pendingComplaints > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                    {pendingComplaints > 9 ? '9+' : pendingComplaints}
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default AdminBottomNav;
