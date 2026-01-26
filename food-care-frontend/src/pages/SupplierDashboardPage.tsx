import { useEffect, useState } from 'react';
import { useSupplierAuth } from '../hooks/useSupplierAuth';
import { SupplierDashboard } from '../components/supplier/SupplierDashboard';
import { SupplierSidebar } from '../components/supplier/SupplierSidebar';
import { Loader2 } from 'lucide-react';

export function SupplierDashboardPage() {
  const { profile, loading, fetchAllData } = useSupplierAuth();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải dashboard...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Không tìm thấy thông tin nhà cung cấp</h2>
          <p className="text-gray-600">Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SupplierSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <main className="flex-1 overflow-y-auto">
        <SupplierDashboard activeTab={activeTab} />
      </main>
    </div>
  );
}
