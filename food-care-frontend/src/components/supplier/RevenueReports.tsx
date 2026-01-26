import { useState } from 'react';
import { TrendingUp, Download, Calendar, DollarSign, ShoppingBag, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRevenueSummary, useRevenueDetailed } from '../../hooks/useSupplierData';

export function RevenueReports() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const { data: revenueData, isLoading } = useRevenueSummary(period);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      notation: amount >= 1000000 ? 'compact' : 'standard',
    }).format(amount);
  };

  const calculateChange = () => {
    if (!revenueData) return 0;
    const current = revenueData.summary.today;
    const previous = revenueData.summary.yesterday;
    return ((current - previous) / previous) * 100;
  };

  const change = calculateChange();
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Báo cáo doanh thu</h2>
            <p className="text-sm text-gray-600 mt-1">Thống kê chi tiết doanh thu và lợi nhuận</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
              <option value="year">Năm nay</option>
            </select>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className={`text-sm font-medium flex items-center gap-1 ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Doanh thu hôm nay</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(revenueData?.summary.today || 0)}</p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600">Doanh thu tuần</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(revenueData?.summary.week || 0)}</p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600">Doanh thu tháng</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(revenueData?.summary.month || 0)}</p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600">Tổng lợi nhuận</p>
          <p className="text-2xl font-semibold mt-1">
            {formatCurrency(revenueData?.dailyRevenue.reduce((sum, day) => sum + day.profit, 0) || 0)}
          </p>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Doanh thu theo ngày</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData?.dailyRevenue || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} name="Doanh thu" />
            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="Lợi nhuận" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Revenue */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Top sản phẩm theo doanh thu</h3>
          <div className="space-y-3">
            {revenueData?.byProduct.slice(0, 5).map((item, index) => {
              const total = revenueData.byProduct.reduce((sum, p) => sum + p.revenue, 0);
              const percentage = (item.revenue / total) * 100;
              
              return (
                <div key={item.productId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium">{item.productName}</span>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Doanh thu theo danh mục</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={revenueData?.byCategory || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {(revenueData?.byCategory || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">Khách hàng mua nhiều nhất</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Khách hàng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tổng chi tiêu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Số đơn</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Giá trị TB/đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {revenueData?.byCustomer.map((customer, index) => (
                <tr key={customer.customerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{customer.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(customer.totalSpent)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customer.orderCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(customer.totalSpent / customer.orderCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
