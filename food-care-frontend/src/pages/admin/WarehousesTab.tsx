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
  Phone, Mail, Eye, Building2, UserPlus, ArrowRightLeft, UserMinus,
  Shield, ClipboardCheck, Settings, ChevronLeft, PackagePlus
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
  WarehouseStaffDetail,
  PagedWarehouseStaff,
  WarehouseDropdownItem,
  CreateWarehouseStaffDto,
  UpdateWarehouseStaffDto,
  StaffPositionEnum,
} from "../../services/admin/warehouseService";
import {
  STAFF_POSITION_LABELS,
  SYSTEM_ACCESS_POSITIONS,
  canAccessSystem as checkCanAccessSystem,
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
            <AddressSelector
              value={{
                province: form.addressCity,
                district: form.addressDistrict,
                ward: form.addressWard,
                street: form.addressStreet,
              }}
              onChange={(addr) =>
                setForm((prev) => ({
                  ...prev,
                  addressStreet: addr.street ?? "",
                  addressCity: addr.province ?? "",
                  addressDistrict: addr.district ?? "",
                  addressWard: addr.ward ?? "",
                }))
              }
              showStreet={true}
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
// WAREHOUSE DETAIL & STAFF MANAGEMENT DIALOG
// =====================================================

interface WarehouseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string | null;
  onStaffChanged?: () => void;
}

type StaffDialogView = "detail" | "staff" | "add-staff" | "transfer" | "create-account" | "edit-staff";

function WarehouseDetailDialog({ open, onOpenChange, warehouseId, onStaffChanged }: WarehouseDetailDialogProps) {
  const [detail, setDetail] = useState<AdminWarehouseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<StaffDialogView>("detail");

  // Staff list
  const [staffList, setStaffList] = useState<WarehouseStaffDetail[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotalPages, setStaffTotalPages] = useState(1);
  const [staffTotalCount, setStaffTotalCount] = useState(0);

  // Transfer/Assign state
  const [transferableStaff, setTransferableStaff] = useState<WarehouseStaffDetail[]>([]);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseDropdownItem[]>([]);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState("");
  const [selectedStaffForTransfer, setSelectedStaffForTransfer] = useState<WarehouseStaffDetail | null>(null);

  // Create account state
  const [createForm, setCreateForm] = useState({
    email: "", password: "", fullName: "", phoneNumber: "",
    employeeCode: "", department: "", staffPositionEnum: "WarehouseStaff" as StaffPositionEnum,
    canApproveReceipts: false, canAdjustInventory: false, canOverrideFifo: false, canCreateInboundSession: false,
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit staff state
  const [editingStaff, setEditingStaff] = useState<WarehouseStaffDetail | null>(null);
  const [editForm, setEditForm] = useState<UpdateWarehouseStaffDto>({});
  const [editLoading, setEditLoading] = useState(false);

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

  const fetchStaff = useCallback(async () => {
    if (!warehouseId) return;
    setStaffLoading(true);
    try {
      const data = await warehouseService.getWarehouseStaff(warehouseId, {
        page: staffPage, pageSize: 10, search: staffSearch || undefined,
      });
      setStaffList(data.items);
      setStaffTotalPages(data.totalPages);
      setStaffTotalCount(data.totalCount);
    } catch {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setStaffLoading(false);
    }
  }, [warehouseId, staffPage, staffSearch]);

  const fetchTransferableStaff = useCallback(async () => {
    if (!warehouseId) return;
    setTransferLoading(true);
    try {
      const data = await warehouseService.getAllStaffWithWarehouse(
        transferSearch || undefined, warehouseId
      );
      setTransferableStaff(data);
    } catch {
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setTransferLoading(false);
    }
  }, [warehouseId, transferSearch]);

  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await warehouseService.getWarehousesDropdown();
      setWarehouses(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (open && warehouseId) {
      setView("detail");
      fetchDetail(warehouseId);
      setStaffSearch("");
      setStaffPage(1);
    }
  }, [open, warehouseId, fetchDetail]);

  useEffect(() => {
    if (view === "staff" && warehouseId) {
      fetchStaff();
    }
  }, [view, fetchStaff, warehouseId]);

  useEffect(() => {
    if ((view === "transfer" || view === "add-staff") && warehouseId) {
      fetchTransferableStaff();
      fetchWarehouses();
    }
  }, [view, fetchTransferableStaff, fetchWarehouses, warehouseId]);

  const handleAssignStaff = async (staffMemberId: string) => {
    if (!warehouseId) return;
    try {
      await warehouseService.assignStaffToWarehouse(warehouseId, staffMemberId);
      toast.success("Gán nhân viên vào kho thành công");
      fetchTransferableStaff();
      fetchStaff();
      onStaffChanged?.();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể gán nhân viên");
    }
  };

  const handleTransferStaff = async () => {
    if (!warehouseId || !selectedStaffForTransfer || !selectedTransferTarget) return;
    try {
      await warehouseService.transferStaff(warehouseId, {
        staffMemberId: selectedStaffForTransfer.staffMemberId,
        targetWarehouseId: selectedTransferTarget,
      });
      toast.success("Chuyển nhân viên thành công");
      setSelectedStaffForTransfer(null);
      setSelectedTransferTarget("");
      fetchStaff();
      onStaffChanged?.();
      setView("staff");
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể chuyển nhân viên");
    }
  };

  const handleRemoveStaff = async (staffMemberId: string) => {
    if (!warehouseId || !window.confirm("Bạn có chắc muốn gỡ nhân viên này khỏi kho?")) return;
    try {
      await warehouseService.removeStaffFromWarehouse(warehouseId, staffMemberId);
      toast.success("Đã gỡ nhân viên khỏi kho");
      fetchStaff();
      onStaffChanged?.();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể gỡ nhân viên");
    }
  };

  const handleCreateStaff = async () => {
    if (!warehouseId) return;
    if (!createForm.email || !createForm.password) {
      toast.error("Vui lòng nhập email và mật khẩu");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("Mật khẩu phải ít nhất 6 ký tự");
      return;
    }
    setCreateLoading(true);
    try {
      const data: CreateWarehouseStaffDto = {
        email: createForm.email,
        password: createForm.password,
        fullName: createForm.fullName || undefined,
        phoneNumber: createForm.phoneNumber || undefined,
        employeeCode: createForm.employeeCode || undefined,
        department: createForm.department || undefined,
        staffPositionEnum: createForm.staffPositionEnum,
        canApproveReceipts: createForm.canApproveReceipts,
        canAdjustInventory: createForm.canAdjustInventory,
        canOverrideFifo: createForm.canOverrideFifo,
        canCreateInboundSession: createForm.canCreateInboundSession,
      };
      await warehouseService.createWarehouseStaff(warehouseId, data);
      toast.success("Tạo tài khoản nhân viên thành công");
      setCreateForm({
        email: "", password: "", fullName: "", phoneNumber: "",
        employeeCode: "", department: "", staffPositionEnum: "WarehouseStaff",
        canApproveReceipts: false, canAdjustInventory: false, canOverrideFifo: false, canCreateInboundSession: false,
      });
      fetchStaff();
      onStaffChanged?.();
      setView("staff");
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể tạo tài khoản nhân viên");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEditStaff = (staff: WarehouseStaffDetail) => {
    setEditingStaff(staff);
    setEditForm({
      department: staff.department || "",
      staffPositionEnum: staff.staffPositionEnum || "WarehouseStaff",
      canApproveReceipts: staff.canApproveReceipts,
      canAdjustInventory: staff.canAdjustInventory,
      canOverrideFifo: staff.canOverrideFifo,
      canCreateInboundSession: staff.canCreateInboundSession,
      isActive: staff.isActive,
    });
    setView("edit-staff");
  };

  const handleUpdateStaff = async () => {
    if (!warehouseId || !editingStaff) return;
    setEditLoading(true);
    try {
      await warehouseService.updateWarehouseStaff(
        warehouseId, editingStaff.staffMemberId, editForm
      );
      toast.success("Cập nhật nhân viên thành công");
      fetchStaff();
      onStaffChanged?.();
      setView("staff");
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể cập nhật nhân viên");
    } finally {
      setEditLoading(false);
    }
  };

  const initTransfer = (staff: WarehouseStaffDetail) => {
    setSelectedStaffForTransfer(staff);
    setSelectedTransferTarget("");
    setView("transfer");
  };

  // Render helpers
  const renderDetailView = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-gray-500">Mã kho</Label>
          <p className="font-medium">{detail?.code}</p>
        </div>
        <div>
          <Label className="text-gray-500">Tên kho</Label>
          <p className="font-medium">{detail?.name}</p>
        </div>
        <div>
          <Label className="text-gray-500">Khu vực</Label>
          <p>{detail?.region || "—"}</p>
        </div>
        <div>
          <Label className="text-gray-500">Sức chứa</Label>
          <p>{detail?.capacity || "—"}</p>
        </div>
      </div>

      {detail?.addressCity && (
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
        {detail?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{detail.phone}</span>
          </div>
        )}
        {detail?.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{detail.email}</span>
          </div>
        )}
      </div>

      {/* Staff summary + management button */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-gray-500">
            Nhân viên ({detail?.staffMembers.length || 0})
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView("staff")}
            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
          >
            <Users className="w-4 h-4 mr-1" />
            Quản lý nhân viên
          </Button>
        </div>
        {detail?.staffMembers.length === 0 ? (
          <p className="text-gray-400 text-sm">Chưa có nhân viên nào được gán</p>
        ) : (
          <div className="space-y-2">
            {detail?.staffMembers.slice(0, 3).map((staff) => (
              <div key={staff.staffMemberId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{staff.fullName || staff.email}</p>
                  <p className="text-xs text-gray-500">
                    {staff.employeeCode} • {staff.staffPositionEnum ? STAFF_POSITION_LABELS[staff.staffPositionEnum] : (staff.position || "Staff")} • {staff.department || "General"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {staff.canApproveReceipts && <Badge variant="outline" className="text-xs">Duyệt phiếu</Badge>}
                  {staff.canAdjustInventory && <Badge variant="outline" className="text-xs">Điều chỉnh kho</Badge>}
                </div>
              </div>
            ))}
            {(detail?.staffMembers.length || 0) > 3 && (
              <button
                onClick={() => setView("staff")}
                className="text-sm text-emerald-600 hover:underline"
              >
                Xem tất cả {detail?.staffMembers.length} nhân viên →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStaffView = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setView("create-account")}
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Tạo tài khoản mới
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setTransferSearch(""); setView("add-staff"); }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Thêm nhân viên có sẵn
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Tìm nhân viên..."
          value={staffSearch}
          onChange={(e) => { setStaffSearch(e.target.value); setStaffPage(1); }}
          className="pl-10"
        />
      </div>

      {/* Staff list */}
      {staffLoading ? (
        <div className="text-center py-4 text-gray-500">Đang tải...</div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-4 text-gray-400">Không có nhân viên nào</div>
      ) : (
        <div className="space-y-2">
          {staffList.map((staff) => (
            <div key={staff.staffMemberId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  {staff.avatarUrl ? (
                    <img src={staff.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-emerald-700 font-medium text-sm">
                      {(staff.fullName || staff.email || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{staff.fullName || staff.email}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {staff.employeeCode} • {staff.staffPositionEnum ? STAFF_POSITION_LABELS[staff.staffPositionEnum] : (staff.position || "Staff")} • {staff.department || "General"}
                  </p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {staff.canApproveReceipts && (
                      <Badge variant="outline" className="text-xs py-0"><ClipboardCheck className="w-3 h-3 mr-0.5" />Duyệt</Badge>
                    )}
                    {staff.canAdjustInventory && (
                      <Badge variant="outline" className="text-xs py-0"><Settings className="w-3 h-3 mr-0.5" />Kho</Badge>
                    )}
                    {staff.canOverrideFifo && (
                      <Badge variant="outline" className="text-xs py-0"><Shield className="w-3 h-3 mr-0.5" />FIFO</Badge>
                    )}
                    {staff.canCreateInboundSession && (
                      <Badge variant="outline" className="text-xs py-0"><PackagePlus className="w-3 h-3 mr-0.5" />Nhập</Badge>
                    )}
                    {!staff.isActive && (
                      <Badge variant="destructive" className="text-xs py-0">Vô hiệu</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <Button variant="ghost" size="sm" onClick={() => openEditStaff(staff)} title="Chỉnh sửa">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => initTransfer(staff)} title="Chuyển kho">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveStaff(staff.staffMemberId)} title="Gỡ khỏi kho">
                  <UserMinus className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {staffTotalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Tổng {staffTotalCount} nhân viên</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={staffPage <= 1} onClick={() => setStaffPage(p => p - 1)}>
              Trước
            </Button>
            <span className="px-2 py-1">{staffPage}/{staffTotalPages}</span>
            <Button variant="outline" size="sm" disabled={staffPage >= staffTotalPages} onClick={() => setStaffPage(p => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAddStaffView = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <p className="text-sm text-gray-500">
        Thêm nhân viên có sẵn trong hệ thống vào kho hàng này. Nhân viên đang thuộc kho khác sẽ được chuyển sang kho này.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Tìm nhân viên theo tên, email, mã NV..."
          value={transferSearch}
          onChange={(e) => setTransferSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {transferLoading ? (
        <div className="text-center py-4 text-gray-500">Đang tải...</div>
      ) : transferableStaff.length === 0 ? (
        <div className="text-center py-4 text-gray-400">Không tìm thấy nhân viên phù hợp</div>
      ) : (
        <div className="space-y-2">
          {transferableStaff.map((staff) => (
            <div key={staff.staffMemberId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{staff.fullName || staff.email}</p>
                <p className="text-xs text-gray-500">
                  {staff.employeeCode} • {staff.staffPositionEnum ? STAFF_POSITION_LABELS[staff.staffPositionEnum] : (staff.position || "Staff")}
                  {staff.currentWarehouseName && (
                    <span className="ml-1 text-blue-600">• Đang ở: {staff.currentWarehouseName}</span>
                  )}
                  {!staff.currentWarehouseId && (
                    <span className="ml-1 text-orange-500">• Chưa gán kho</span>
                  )}
                </p>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 shrink-0 ml-2"
                onClick={() => handleAssignStaff(staff.staffMemberId)}
              >
                <Plus className="w-4 h-4 mr-1" />
                {staff.currentWarehouseId ? "Chuyển về đây" : "Thêm"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTransferView = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {selectedStaffForTransfer ? (
        <>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Chuyển nhân viên <strong>{selectedStaffForTransfer.fullName || selectedStaffForTransfer.email}</strong>{" "}
              ({selectedStaffForTransfer.employeeCode}) sang kho hàng khác
            </p>
          </div>

          <div>
            <Label>Chọn kho hàng đích</Label>
            <Select value={selectedTransferTarget} onValueChange={setSelectedTransferTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn kho hàng..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses
                  .filter(w => w.id !== warehouseId)
                  .map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code}) {w.region ? `- ${w.region}` : ''}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setView("staff")}>Hủy</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!selectedTransferTarget}
              onClick={handleTransferStaff}
            >
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Chuyển nhân viên
            </Button>
          </DialogFooter>
        </>
      ) : (
        <p className="text-gray-400 text-center py-8">Chưa chọn nhân viên để chuyển</p>
      )}
    </div>
  );

  const renderCreateAccountView = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <p className="text-sm text-gray-500">
        Tạo tài khoản mới cho nhân viên và tự động gán vào kho hàng "{detail?.name}".
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
            placeholder="nhanvien@foodcare.com"
          />
        </div>
        <div className="col-span-2">
          <Label>Mật khẩu *</Label>
          <Input
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Ít nhất 6 ký tự"
          />
        </div>
        <div>
          <Label>Họ tên</Label>
          <Input
            value={createForm.fullName}
            onChange={(e) => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <Label>Số điện thoại</Label>
          <Input
            value={createForm.phoneNumber}
            onChange={(e) => setCreateForm(f => ({ ...f, phoneNumber: e.target.value }))}
            placeholder="0901234567"
          />
        </div>
        <div>
          <Label>Mã nhân viên</Label>
          <Input
            value={createForm.employeeCode}
            onChange={(e) => setCreateForm(f => ({ ...f, employeeCode: e.target.value }))}
            placeholder="Tự động nếu bỏ trống"
          />
        </div>
        <div>
          <Label>Bộ phận</Label>
          <Input
            value={createForm.department}
            onChange={(e) => setCreateForm(f => ({ ...f, department: e.target.value }))}
            placeholder="General"
          />
        </div>
        <div className="col-span-2">
          <Label>Chức vụ</Label>
          <Select
            value={createForm.staffPositionEnum}
            onValueChange={(v) => setCreateForm(f => ({ ...f, staffPositionEnum: v as StaffPositionEnum }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn chức vụ" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STAFF_POSITION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                  {SYSTEM_ACCESS_POSITIONS.includes(value as StaffPositionEnum) ? " (Truy cập HT)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {checkCanAccessSystem(createForm.staffPositionEnum) && (
            <p className="text-xs text-emerald-600 mt-1">✓ Được phép truy cập hệ thống staff</p>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t pt-3">
        <Label className="text-gray-500">Quyền hạn</Label>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Duyệt phiếu nhập</span>
          </div>
          <Switch
            checked={createForm.canApproveReceipts}
            onCheckedChange={(v) => setCreateForm(f => ({ ...f, canApproveReceipts: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Điều chỉnh tồn kho</span>
          </div>
          <Switch
            checked={createForm.canAdjustInventory}
            onCheckedChange={(v) => setCreateForm(f => ({ ...f, canAdjustInventory: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Override FIFO</span>
          </div>
          <Switch
            checked={createForm.canOverrideFifo}
            onCheckedChange={(v) => setCreateForm(f => ({ ...f, canOverrideFifo: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Tạo phiên nhập kho</span>
          </div>
          <Switch
            checked={createForm.canCreateInboundSession}
            onCheckedChange={(v) => setCreateForm(f => ({ ...f, canCreateInboundSession: v }))}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setView("staff")} disabled={createLoading}>
          Hủy
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={handleCreateStaff}
          disabled={createLoading}
        >
          {createLoading ? "Đang tạo..." : "Tạo tài khoản"}
        </Button>
      </DialogFooter>
    </div>
  );

  const renderEditStaffView = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="font-medium">{editingStaff?.fullName || editingStaff?.email}</p>
        <p className="text-xs text-gray-500">{editingStaff?.employeeCode}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Bộ phận</Label>
          <Input
            value={editForm.department || ""}
            onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))}
          />
        </div>
        <div>
          <Label>Chức vụ</Label>
          <Select
            value={editForm.staffPositionEnum || "WarehouseStaff"}
            onValueChange={(v) => setEditForm(f => ({ ...f, staffPositionEnum: v as StaffPositionEnum }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STAFF_POSITION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                  {SYSTEM_ACCESS_POSITIONS.includes(value as StaffPositionEnum) ? " (HT)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 border-t pt-3">
        <Label className="text-gray-500">Quyền hạn</Label>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Duyệt phiếu nhập</span>
          </div>
          <Switch
            checked={editForm.canApproveReceipts ?? false}
            onCheckedChange={(v) => setEditForm(f => ({ ...f, canApproveReceipts: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Điều chỉnh tồn kho</span>
          </div>
          <Switch
            checked={editForm.canAdjustInventory ?? false}
            onCheckedChange={(v) => setEditForm(f => ({ ...f, canAdjustInventory: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Override FIFO</span>
          </div>
          <Switch
            checked={editForm.canOverrideFifo ?? false}
            onCheckedChange={(v) => setEditForm(f => ({ ...f, canOverrideFifo: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Tạo phiên nhập kho</span>
          </div>
          <Switch
            checked={editForm.canCreateInboundSession ?? false}
            onCheckedChange={(v) => setEditForm(f => ({ ...f, canCreateInboundSession: v }))}
          />
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm font-medium">Trạng thái hoạt động</span>
          <Switch
            checked={editForm.isActive ?? true}
            onCheckedChange={(v) => setEditForm(f => ({ ...f, isActive: v }))}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setView("staff")} disabled={editLoading}>
          Hủy
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={handleUpdateStaff}
          disabled={editLoading}
        >
          {editLoading ? "Đang lưu..." : "Cập nhật"}
        </Button>
      </DialogFooter>
    </div>
  );

  const getDialogTitle = () => {
    switch (view) {
      case "detail": return "Chi tiết kho hàng";
      case "staff": return `Quản lý nhân viên — ${detail?.name || ""}`;
      case "add-staff": return "Thêm nhân viên có sẵn";
      case "transfer": return "Chuyển nhân viên sang kho khác";
      case "create-account": return "Tạo tài khoản nhân viên mới";
      case "edit-staff": return "Chỉnh sửa nhân viên";
    }
  };

  const canGoBack = view !== "detail";
  const goBack = () => {
    if (view === "add-staff" || view === "transfer" || view === "create-account" || view === "edit-staff") {
      setView("staff");
    } else if (view === "staff") {
      setView("detail");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {canGoBack && (
              <button onClick={goBack} className="hover:bg-gray-100 rounded p-1 transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {getDialogTitle()}
          </DialogTitle>
          {view === "detail" && (
            <DialogDescription>Thông tin và nhân viên của kho hàng</DialogDescription>
          )}
        </DialogHeader>

        {loading && view === "detail" ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : (
          <>
            {view === "detail" && detail && renderDetailView()}
            {view === "staff" && renderStaffView()}
            {view === "add-staff" && renderAddStaffView()}
            {view === "transfer" && renderTransferView()}
            {view === "create-account" && renderCreateAccountView()}
            {view === "edit-staff" && renderEditStaffView()}
          </>
        )}
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

        {/* Region Distribution — Click to filter */}
        {stats && Object.keys(stats.warehousesByRegion).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Phân bố theo khu vực
              </CardTitle>
              <CardDescription>Nhấn vào khu vực để lọc danh sách kho hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {/* All regions button */}
                <button
                  onClick={() => { setRegionFilter("all"); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all cursor-pointer border
                    ${!regionFilter || regionFilter === "all"
                      ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"}`}
                >
                  Tất cả ({Object.values(stats.warehousesByRegion).reduce((a, b) => a + b, 0)} kho)
                </button>
                {Object.entries(stats.warehousesByRegion).map(([region, count]) => (
                  <button
                    key={region}
                    onClick={() => { setRegionFilter(region); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all cursor-pointer border
                      ${regionFilter === region
                        ? `${getRegionColor(region)} ring-2 ring-offset-1 ring-current shadow-sm border-transparent`
                        : `${getRegionColor(region)} border-transparent hover:ring-1 hover:ring-current`}`}
                  >
                    {getRegionLabel(region)} ({count} kho)
                  </button>
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
        onStaffChanged={() => { loadWarehouses(); loadStats(); }}
      />
    </>
  );
}
