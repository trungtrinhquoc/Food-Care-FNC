import { useState, useEffect, useCallback } from "react";
import { AddressSelector } from "../../components/AddressSelector";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
  Plus, Search, Edit, Trash2, Warehouse, Users, MapPin, BarChart3,
  Phone, Mail, Eye, Building2
} from "lucide-react";
import { toast } from "sonner";
import { warehouseService } from "../../services/admin";
import type {
  AdminWarehouse,
  AdminWarehouseDetail,
  WarehouseStats,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  PagedWarehouses,
} from "../../services/admin/warehouseService";

// =====================================================
// WAREHOUSE DIALOG
// =====================================================

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: AdminWarehouse | null;
  onSuccess: () => void;
}

interface WarehouseFormData {
  code: string;
  name: string;
  description: string;
  region: string;
  addressStreet: string;
  addressWard: string;
  addressDistrict: string;
  addressCity: string;
  phone: string;
  email: string;
  capacity: string;
  isDefault: boolean;
}

const initialForm: WarehouseFormData = {
  code: "",
  name: "",
  description: "",
  region: "",
  addressStreet: "",
  addressWard: "",
  addressDistrict: "",
  addressCity: "",
  phone: "",
  email: "",
  capacity: "",
  isDefault: false,
};

function WarehouseDialog({ open, onOpenChange, warehouse, onSuccess }: WarehouseDialogProps) {
  const [form, setForm] = useState<WarehouseFormData>(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (warehouse) {
        setForm({
          code: warehouse.code,
          name: warehouse.name,
          description: warehouse.description || "",
          region: warehouse.region || "",
          addressStreet: warehouse.addressStreet || "",
          addressWard: warehouse.addressWard || "",
          addressDistrict: warehouse.addressDistrict || "",
          addressCity: warehouse.addressCity || "",
          phone: warehouse.phone || "",
          email: warehouse.email || "",
          capacity: warehouse.capacity?.toString() || "",
          isDefault: warehouse.isDefault,
        });
      } else {
        setForm(initialForm);
      }
    }
  }, [open, warehouse]);

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Vui lòng nhập mã và tên kho hàng");
      return;
    }

    setSaving(true);
    try {
      if (warehouse) {
        const data: UpdateWarehouseDto = {
          name: form.name,
          description: form.description || undefined,
          region: form.region || undefined,
          addressStreet: form.addressStreet || undefined,
          addressWard: form.addressWard || undefined,
          addressDistrict: form.addressDistrict || undefined,
          addressCity: form.addressCity || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          capacity: form.capacity ? parseInt(form.capacity) : undefined,
          isDefault: form.isDefault || undefined,
        };
        await warehouseService.updateWarehouse(warehouse.id, data);
        toast.success("Cập nhật kho hàng thành công");
      } else {
        const data: CreateWarehouseDto = {
          code: form.code,
          name: form.name,
          description: form.description || undefined,
          region: form.region || undefined,
          addressStreet: form.addressStreet || undefined,
          addressWard: form.addressWard || undefined,
          addressDistrict: form.addressDistrict || undefined,
          addressCity: form.addressCity || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          capacity: form.capacity ? parseInt(form.capacity) : undefined,
          isDefault: form.isDefault,
        };
        await warehouseService.createWarehouse(data);
        toast.success("Tạo kho hàng thành công");
      }
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to save warehouse:", error);
      const errMsg =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(errMsg || "Không thể lưu kho hàng");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof WarehouseFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{warehouse ? "Chỉnh sửa kho hàng" : "Thêm kho hàng mới"}</DialogTitle>
          <DialogDescription>
            {warehouse ? "Cập nhật thông tin kho hàng" : "Tạo kho hàng mới trong hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mã kho *</Label>
              <Input
                value={form.code}
                onChange={(e) => update("code", e.target.value)}
                placeholder="WH-001"
                disabled={!!warehouse}
              />
            </div>
            <div>
              <Label>Tên kho *</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Kho Hồ Chí Minh" />
            </div>
          </div>

          <div>
            <Label>Mô tả</Label>
            <Input value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Kho hàng chính khu vực phía Nam" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Khu vực</Label>
              <Select value={form.region} onValueChange={(v) => update("region", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North">Miền Bắc</SelectItem>
                  <SelectItem value="Central">Miền Trung</SelectItem>
                  <SelectItem value="South">Miền Nam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sức chứa</Label>
              <Input type="number" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="1000" />
            </div>
          </div>

          <div>
            <Label>Địa chỉ</Label>
            <Input
              value={form.addressStreet}
              onChange={(e) => update("addressStreet", e.target.value)}
              placeholder="Số nhà, đường"
              className="mb-2"
            />
            <AddressSelector
              value={{
                province: form.addressCity,
                district: form.addressDistrict,
                ward: form.addressWard,
              }}
              onChange={(addr) =>
                setForm((prev) => ({
                  ...prev,
                  addressCity: addr.province ?? "",
                  addressDistrict: addr.district ?? "",
                  addressWard: addr.ward ?? "",
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Số điện thoại</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="028 1234 5678" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="warehouse@example.com" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Kho mặc định</Label>
            <Switch checked={form.isDefault} onCheckedChange={(v) => update("isDefault", v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={saving}>
            {saving ? "Đang lưu..." : warehouse ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// WAREHOUSE DETAIL DIALOG
// =====================================================

interface WarehouseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string | null;
}

function WarehouseDetailDialog({ open, onOpenChange, warehouseId }: WarehouseDetailDialogProps) {
  const [detail, setDetail] = useState<AdminWarehouseDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await warehouseService.getWarehouseById(id);
      setDetail(data);
    } catch {
      toast.error("Không thể tải chi tiết kho hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && warehouseId) {
      fetchDetail(warehouseId);
    }
  }, [open, warehouseId, fetchDetail]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết kho hàng</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : detail ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Mã kho</Label>
                <p className="font-medium">{detail.code}</p>
              </div>
              <div>
                <Label className="text-gray-500">Tên kho</Label>
                <p className="font-medium">{detail.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Khu vực</Label>
                <p>{detail.region || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-500">Sức chứa</Label>
                <p>{detail.capacity || "—"}</p>
              </div>
            </div>

            {detail.addressCity && (
              <div>
                <Label className="text-gray-500">Địa chỉ</Label>
                <p>
                  {[detail.addressStreet, detail.addressWard, detail.addressDistrict, detail.addressCity]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {detail.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{detail.phone}</span>
                </div>
              )}
              {detail.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{detail.email}</span>
                </div>
              )}
            </div>

            {/* Staff members list */}
            <div>
              <Label className="text-gray-500 mb-2 block">
                Nhân viên ({detail.staffMembers.length})
              </Label>
              {detail.staffMembers.length === 0 ? (
                <p className="text-gray-400 text-sm">Chưa có nhân viên nào được gán</p>
              ) : (
                <div className="space-y-2">
                  {detail.staffMembers.map((staff) => (
                    <div key={staff.staffMemberId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{staff.fullName || staff.email}</p>
                        <p className="text-xs text-gray-500">
                          {staff.employeeCode} • {staff.position || "Staff"} • {staff.department || "General"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {staff.canApproveReceipts && <Badge variant="outline" className="text-xs">Duyệt phiếu</Badge>}
                        {staff.canAdjustInventory && <Badge variant="outline" className="text-xs">Điều chỉnh kho</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// MAIN WAREHOUSES TAB
// =====================================================

export function WarehousesTab() {
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<AdminWarehouse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const result: PagedWarehouses = await warehouseService.getWarehouses({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        region: regionFilter === "all" ? undefined : regionFilter || undefined,
        isActive: activeFilter === "all" ? undefined : activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
      });
      setWarehouses(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalCount);
    } catch (error) {
      console.error("Failed to load warehouses:", error);
      toast.error("Không thể tải danh sách kho hàng");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, regionFilter, activeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await warehouseService.getWarehouseStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load warehouse stats:", error);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
    loadStats();
  }, [loadWarehouses, loadStats]);

  const handleAdd = () => {
    setEditingWarehouse(null);
    setDialogOpen(true);
  };

  const handleEdit = (wh: AdminWarehouse) => {
    setEditingWarehouse(wh);
    setDialogOpen(true);
  };

  const handleViewDetail = (id: string) => {
    setSelectedWarehouseId(id);
    setDetailDialogOpen(true);
  };

  const handleToggleActive = async (wh: AdminWarehouse) => {
    try {
      await warehouseService.toggleWarehouseActive(wh.id);
      toast.success(wh.isActive ? "Đã vô hiệu hóa kho hàng" : "Đã kích hoạt kho hàng");
      loadWarehouses();
      loadStats();
    } catch (error) {
      console.error("Failed to toggle warehouse:", error);
      toast.error("Không thể thay đổi trạng thái kho hàng");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa kho hàng này?")) return;
    try {
      await warehouseService.deleteWarehouse(id);
      toast.success("Xóa kho hàng thành công");
      loadWarehouses();
      loadStats();
    } catch (error: unknown) {
      console.error("Failed to delete warehouse:", error);
      const errMsg =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(errMsg || "Không thể xóa kho hàng");
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingWarehouse(null);
    loadWarehouses();
    loadStats();
  };

  const getRegionLabel = (region?: string) => {
    switch (region) {
      case "North": return "Miền Bắc";
      case "Central": return "Miền Trung";
      case "South": return "Miền Nam";
      default: return region || "—";
    }
  };

  const getRegionColor = (region?: string) => {
    switch (region) {
      case "North": return "bg-blue-100 text-blue-800";
      case "Central": return "bg-yellow-100 text-yellow-800";
      case "South": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
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
                  <Warehouse className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalWarehouses}</div>
                    <div className="text-sm text-gray-500">Tổng kho hàng</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.activeWarehouses}</div>
                    <div className="text-sm text-gray-500">Đang hoạt động</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalStaffAssigned}</div>
                    <div className="text-sm text-gray-500">Nhân viên được gán</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{Object.keys(stats.warehousesByRegion).length}</div>
                    <div className="text-sm text-gray-500">Khu vực phủ sóng</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Region Distribution */}
        {stats && Object.keys(stats.warehousesByRegion).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Phân bố theo khu vực
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                {Object.entries(stats.warehousesByRegion).map(([region, count]) => (
                  <div key={region} className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getRegionColor(region)}`}>
                      {getRegionLabel(region)}
                    </span>
                    <span className="font-medium">{count} kho</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warehouses Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5" />
                  Quản lý kho hàng
                </CardTitle>
                <CardDescription>Tổng {totalItems} kho hàng</CardDescription>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm kho hàng
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, mã kho, thành phố..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
              <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khu vực</SelectItem>
                  <SelectItem value="North">Miền Bắc</SelectItem>
                  <SelectItem value="Central">Miền Trung</SelectItem>
                  <SelectItem value="South">Miền Nam</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Vô hiệu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có kho hàng nào</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kho hàng</TableHead>
                    <TableHead>Khu vực</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((wh) => (
                    <TableRow key={wh.id} className={!wh.isActive ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {wh.name}
                            {wh.isDefault && <Badge variant="outline" className="text-xs bg-yellow-50">Mặc định</Badge>}
                          </div>
                          <div className="text-xs text-gray-500">{wh.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {wh.region ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRegionColor(wh.region)}`}>
                            {getRegionLabel(wh.region)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-gray-600">
                          {[wh.addressDistrict, wh.addressCity].filter(Boolean).join(", ") || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{wh.staffCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{wh.totalInventoryItems}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={wh.isActive ? "default" : "destructive"}>
                          {wh.isActive ? "Hoạt động" : "Vô hiệu"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(wh.id)} title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(wh)} title="Chỉnh sửa">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(wh)}
                            title={wh.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            <Building2 className={`w-4 h-4 ${wh.isActive ? "text-yellow-500" : "text-green-500"}`} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(wh.id)} title="Xóa">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="kho hàng"
            />
          </CardContent>
        </Card>
      </div>

      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouse={editingWarehouse}
        onSuccess={handleDialogSuccess}
      />

      <WarehouseDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        warehouseId={selectedWarehouseId}
      />
    </>
  );
}
