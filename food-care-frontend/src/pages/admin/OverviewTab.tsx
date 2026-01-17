import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Download, Send, Bell, DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { StatsCard } from "../../components/admin/StatsCard";
import { RevenueChart } from "../../components/admin/RevenueChart";
import type { AdminStats, RevenueData } from "../../types/admin";

interface OverviewTabProps {
  stats: AdminStats;
  revenueData: RevenueData[];
  totalProducts: number;
}

export function OverviewTab({ stats, revenueData, totalProducts }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Doanh thu"
          value={`${stats.totalRevenue.toLocaleString('vi-VN')}đ`}
          icon={DollarSign}
          iconColor="text-emerald-600"
          subtitle={`+${stats.monthlyGrowth}% so với tháng trước`}
        />
        <StatsCard
          title="Đơn hàng"
          value={stats.totalOrders}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          subtitle={`${stats.activeSubscriptions} đơn định kỳ`}
        />
        <StatsCard
          title="Khách hàng"
          value={stats.totalCustomers}
          icon={Users}
          iconColor="text-purple-600"
          subtitle="Tổng người dùng đã đăng ký"
        />
        <StatsCard
          title="Sản phẩm"
          value={totalProducts}
          icon={Package}
          iconColor="text-orange-600"
          subtitle="Đang kinh doanh"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu 6 tháng gần nhất</CardTitle>
        </CardHeader>
        <RevenueChart data={revenueData} />
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hành động nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Gửi thông báo
            </Button>
            <Button variant="outline">
              <Bell className="w-4 h-4 mr-2" />
              Cài đặt nhắc nhở
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
