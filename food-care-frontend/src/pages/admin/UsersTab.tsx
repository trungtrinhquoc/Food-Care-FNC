import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { SimplePagination } from "../../components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { 
  Plus, Search, Edit, Trash2, UserCheck, UserX, 
  Users, UserPlus, Shield, Key, BarChart3 
} from "lucide-react";
import { usersService } from "../../services/admin";
import type { AdminUser, UserStats, PagedResult } from "../../types/admin";
import { UserDialog } from "../../components/admin/UserDialog";
import { ChangePasswordDialog } from "../../components/admin/ChangePasswordDialog";

export function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result: PagedResult<AdminUser> = await usersService.getUsers({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined,
        sortBy: 'createdAt',
        sortDesc: true,
      });
      setUsers(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, roleFilter, activeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await usersService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [loadUsers, loadStats]);

  const handleAdd = () => {
    setEditingUser(null);
    setUserDialogOpen(true);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setUserDialogOpen(true);
  };

  const handleChangePassword = (userId: string) => {
    setSelectedUserId(userId);
    setPasswordDialogOpen(true);
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await usersService.toggleUserActive(user.id);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    
    try {
      await usersService.deleteUser(id);
      loadUsers();
      loadStats();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleDialogSuccess = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
    loadUsers();
    loadStats();
  };

  const handlePasswordSuccess = () => {
    setPasswordDialogOpen(false);
    setSelectedUserId(null);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'destructive';
      case 'staff': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'Admin';
      case 'staff': return 'Nhân viên';
      default: return 'Khách hàng';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <div className="text-sm text-gray-500">Tổng người dùng</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <div className="text-sm text-gray-500">Đang hoạt động</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-8 h-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
                    <div className="text-sm text-gray-500">Mới tháng này</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.usersByRole['admin'] || 0}</div>
                    <div className="text-sm text-gray-500">Admin</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Role Distribution */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Phân bố vai trò
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(role)}>{getRoleLabel(role)}</Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Quản lý người dùng
                </CardTitle>
                <CardDescription>Tổng {totalItems} người dùng</CardDescription>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm người dùng
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo email, tên, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="customer">Khách hàng</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có người dùng nào</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Hạng</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Đơn hàng</TableHead>
                    <TableHead>Chi tiêu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName || user.email}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm font-medium">
                                {(user.fullName || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{user.fullName || '(Chưa đặt tên)'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                            {user.phoneNumber && (
                              <div className="text-xs text-gray-400">{user.phoneNumber}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.tierName ? (
                          <Badge variant="outline">{user.tierName}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{user.loyaltyPoints || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span>{user.totalOrders}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {user.totalSpent.toLocaleString('vi-VN')}đ
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChangePassword(user.id)}
                            title="Đổi mật khẩu"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                            title={user.isActive ? "Khóa tài khoản" : "Mở khóa"}
                          >
                            {user.isActive ? (
                              <UserX className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="người dùng"
            />
          </CardContent>
        </Card>
      </div>

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
        onSuccess={handleDialogSuccess}
      />

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        userId={selectedUserId}
        onSuccess={handlePasswordSuccess}
      />
    </>
  );
}
