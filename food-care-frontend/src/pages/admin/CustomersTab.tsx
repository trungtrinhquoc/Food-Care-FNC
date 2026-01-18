import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Search, Download, Eye, MessageSquare, Users, Crown, ShoppingBag, CreditCard, RefreshCw, Mail, Phone, Loader2 } from "lucide-react";
import { TierBadge } from "../../components/ui/status-badge";
import { SimplePagination } from "../../components/ui/pagination";
import api from "../../services/api";
import type { MemberTier } from "../../types/admin";

interface Customer {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  tierName: string;
  tierId: number | null;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  activeSubscriptions: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  lastOrderDate: string | null;
}

interface CustomerStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByTier: Record<string, number>;
}

export function CustomersTab() {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        pageSize,
        role: 'customer', // Only fetch customers
      };
      
      if (searchTerm) params.search = searchTerm;
      if (tierFilter !== 'all') params.tierId = parseInt(tierFilter);
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';

      const response = await api.get('/admin/users', { params });
      
      setCustomers(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || 0);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, tierFilter, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/users/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, tierFilter, statusFilter]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return `${(amount / 1000).toFixed(0)}K`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng khách hàng</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Khách hoạt động</p>
                <p className="text-2xl font-bold text-green-600">{stats?.activeUsers || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Khách mới tháng này</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.newUsersThisMonth || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Khách VIP (Gold+)</p>
                <p className="text-2xl font-bold text-amber-600">
                  {(stats?.usersByTier?.['Gold'] || 0) + (stats?.usersByTier?.['Platinum'] || 0)}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Quản lý khách hàng
              </CardTitle>
              <CardDescription>Tổng {totalItems} khách hàng trong hệ thống</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchCustomers}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Làm mới
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Hạng thành viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hạng</SelectItem>
                <SelectItem value="1">Bronze</SelectItem>
                <SelectItem value="2">Silver</SelectItem>
                <SelectItem value="3">Gold</SelectItem>
                <SelectItem value="4">Platinum</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Ngừng HĐ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Không tìm thấy khách hàng nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Hạng</TableHead>
                      <TableHead className="text-center">Điểm</TableHead>
                      <TableHead className="text-center">Đơn hàng</TableHead>
                      <TableHead className="text-right">Chi tiêu</TableHead>
                      <TableHead className="text-center">Định kỳ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                              {customer.fullName?.charAt(0)?.toUpperCase() || customer.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{customer.fullName || 'Chưa cập nhật'}</div>
                              <div className="text-xs text-gray-500">
                                Tham gia: {formatDate(customer.createdAt)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {customer.email}
                            </div>
                            {customer.phoneNumber && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {customer.phoneNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TierBadge tier={(customer.tierName || 'Bronze') as MemberTier} />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-amber-600">{customer.loyaltyPoints}</span>
                        </TableCell>
                        <TableCell className="text-center font-medium">{customer.totalOrders}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {formatCurrency(customer.totalSpent)}
                        </TableCell>
                        <TableCell className="text-center">
                          {customer.activeSubscriptions > 0 ? (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {customer.activeSubscriptions} gói
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {customer.isActive ? 'Hoạt động' : 'Ngừng HĐ'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" title="Xem chi tiết">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Gửi tin nhắn">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4">
                <SimplePagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  itemLabel="khách hàng"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
