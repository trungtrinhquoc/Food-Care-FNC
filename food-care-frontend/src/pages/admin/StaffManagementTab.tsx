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
  Search, Edit, Warehouse, Users, MapPin, BarChart3,
  UserPlus, ArrowRightLeft, UserMinus, Plus,
  Shield, ClipboardCheck, Settings, ChevronLeft,
  HardHat, Building2, Monitor, Briefcase, PackagePlus
} from "lucide-react";
import { toast } from "sonner";
import { warehouseService } from "../../services/admin";
import type {
  AdminWarehouse,
  WarehouseStats,
  PagedWarehouses,
  WarehouseStaffDetail,
  WarehouseDropdownItem,
  CreateWarehouseStaffDto,
  UpdateWarehouseStaffDto,
  StaffPositionEnum,
  StaffPositionInfo,
} from "../../services/admin/warehouseService";
import {
  STAFF_POSITION_LABELS,
  SYSTEM_ACCESS_POSITIONS,
  canAccessSystem as checkCanAccessSystem,
} from "../../services/admin/warehouseService";

// =====================================================
// POSITION HELPERS
// =====================================================

const getPositionBadgeColor = (pos?: StaffPositionEnum | null): string => {
  switch (pos) {
    case "WarehouseManager": return "bg-red-100 text-red-800 border-red-200";
    case "AssistantManager": return "bg-orange-100 text-orange-800 border-orange-200";
    case "Supervisor": return "bg-blue-100 text-blue-800 border-blue-200";
    case "InventoryController": return "bg-purple-100 text-purple-800 border-purple-200";
    case "WarehouseStaff": return "bg-green-100 text-green-800 border-green-200";
    case "Loader": return "bg-gray-100 text-gray-800 border-gray-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

const getPositionIcon = (pos?: StaffPositionEnum | null) => {
  switch (pos) {
    case "WarehouseManager": return <Briefcase className="w-3 h-3" />;
    case "AssistantManager": return <Shield className="w-3 h-3" />;
    case "Supervisor": return <HardHat className="w-3 h-3" />;
    case "InventoryController": return <ClipboardCheck className="w-3 h-3" />;
    case "WarehouseStaff": return <Settings className="w-3 h-3" />;
    case "Loader": return <Building2 className="w-3 h-3" />;
    default: return null;
  }
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

// =====================================================
// WAREHOUSE STAFF MANAGEMENT PAGE (inner view)
// =====================================================

interface WarehouseStaffPageProps {
  warehouse: AdminWarehouse;
  onBack: () => void;
}

function WarehouseStaffPage({ warehouse, onBack }: WarehouseStaffPageProps) {
  // Staff list state
  const [staffList, setStaffList] = useState<WarehouseStaffDetail[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotalPages, setStaffTotalPages] = useState(1);
  const [staffTotalCount, setStaffTotalCount] = useState(0);

  // Positions
  const [positions, setPositions] = useState<StaffPositionInfo[]>([]);

  // Dialog states
  const [dialogMode, setDialogMode] = useState<
    null | "create" | "edit" | "transfer" | "assign"
  >(null);

  // Create/Edit state
  const [createForm, setCreateForm] = useState({
    email: "", password: "", fullName: "", phoneNumber: "",
    employeeCode: "", department: "", staffPositionEnum: "WarehouseStaff" as StaffPositionEnum,
    canApproveReceipts: false, canAdjustInventory: false, canOverrideFifo: false, canCreateInboundSession: false,
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit state
  const [editingStaff, setEditingStaff] = useState<WarehouseStaffDetail | null>(null);
  const [editForm, setEditForm] = useState<UpdateWarehouseStaffDto>({});
  const [editLoading, setEditLoading] = useState(false);

  // Transfer state
  const [selectedStaffForTransfer, setSelectedStaffForTransfer] = useState<WarehouseStaffDetail | null>(null);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState("");
  const [warehouses, setWarehouses] = useState<WarehouseDropdownItem[]>([]);

  // Assign (add existing) state
  const [transferableStaff, setTransferableStaff] = useState<WarehouseStaffDetail[]>([]);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // Fetch staff list
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const data = await warehouseService.getWarehouseStaff(warehouse.id, {
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
  }, [warehouse.id, staffPage, staffSearch]);

  // Fetch positions list
  const fetchPositions = useCallback(async () => {
    try {
      const data = await warehouseService.getStaffPositions();
      setPositions(data);
    } catch {
      // Fallback: use local labels
      setPositions([]);
    }
  }, []);

  // Fetch warehouses for transfer dropdown
  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await warehouseService.getWarehousesDropdown();
      setWarehouses(data);
    } catch { /* ignore */ }
  }, []);

  // Fetch transferable staff
  const fetchTransferableStaff = useCallback(async () => {
    setTransferLoading(true);
    try {
      const data = await warehouseService.getAllStaffWithWarehouse(
        transferSearch || undefined, warehouse.id
      );
      setTransferableStaff(data);
    } catch {
      toast.error("Không thể tải danh sách nhân viên khả dụng");
    } finally {
      setTransferLoading(false);
    }
  }, [warehouse.id, transferSearch]);

  useEffect(() => {
    fetchStaff();
    fetchPositions();
  }, [fetchStaff, fetchPositions]);

  // When assign dialog opens
  useEffect(() => {
    if (dialogMode === "assign") {
      fetchTransferableStaff();
    }
  }, [dialogMode, fetchTransferableStaff]);

  // When transfer dialog opens
  useEffect(() => {
    if (dialogMode === "transfer") {
      fetchWarehouses();
    }
  }, [dialogMode, fetchWarehouses]);

  // Handlers
  const handleRemoveStaff = async (staffMemberId: string) => {
    if (!window.confirm("Bạn có chắc muốn gỡ nhân viên này khỏi kho?")) return;
    try {
      await warehouseService.removeStaffFromWarehouse(warehouse.id, staffMemberId);
      toast.success("Đã gỡ nhân viên khỏi kho");
      fetchStaff();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể gỡ nhân viên");
    }
  };

  const handleCreateStaff = async () => {
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
      await warehouseService.createWarehouseStaff(warehouse.id, data);
      toast.success("Tạo tài khoản nhân viên thành công");
      setCreateForm({
        email: "", password: "", fullName: "", phoneNumber: "",
        employeeCode: "", department: "", staffPositionEnum: "WarehouseStaff",
        canApproveReceipts: false, canAdjustInventory: false, canOverrideFifo: false, canCreateInboundSession: false,
      });
      setDialogMode(null);
      fetchStaff();
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
    setDialogMode("edit");
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    setEditLoading(true);
    try {
      await warehouseService.updateWarehouseStaff(
        warehouse.id, editingStaff.staffMemberId, editForm
      );
      toast.success("Cập nhật nhân viên thành công");
      setDialogMode(null);
      setEditingStaff(null);
      fetchStaff();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể cập nhật nhân viên");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAssignStaff = async (staffMemberId: string) => {
    try {
      await warehouseService.assignStaffToWarehouse(warehouse.id, staffMemberId);
      toast.success("Gán nhân viên vào kho thành công");
      fetchTransferableStaff();
      fetchStaff();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể gán nhân viên");
    }
  };

  const initTransfer = (staff: WarehouseStaffDetail) => {
    setSelectedStaffForTransfer(staff);
    setSelectedTransferTarget("");
    setDialogMode("transfer");
  };

  const handleTransferStaff = async () => {
    if (!selectedStaffForTransfer || !selectedTransferTarget) return;
    try {
      await warehouseService.transferStaff(warehouse.id, {
        staffMemberId: selectedStaffForTransfer.staffMemberId,
        targetWarehouseId: selectedTransferTarget,
      });
      toast.success("Chuyển nhân viên thành công");
      setDialogMode(null);
      setSelectedStaffForTransfer(null);
      setSelectedTransferTarget("");
      fetchStaff();
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errMsg || "Không thể chuyển nhân viên");
    }
  };

  // Stats by position
  const positionCounts = staffList.reduce<Record<string, number>>((acc, s) => {
    const key = s.staffPositionEnum || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const systemAccessCount = staffList.filter(s => checkCanAccessSystem(s.staffPositionEnum)).length;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-emerald-600" />
            {warehouse.name}
          </h2>
          <p className="text-sm text-gray-500">
            {warehouse.code} • {getRegionLabel(warehouse.region)} •{" "}
            {[warehouse.addressDistrict, warehouse.addressCity].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ"}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{staffTotalCount}</div>
                <div className="text-sm text-gray-500">Tổng nhân viên</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{systemAccessCount}</div>
                <div className="text-sm text-gray-500">Truy cập hệ thống</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <HardHat className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{Object.keys(positionCounts).length}</div>
                <div className="text-sm text-gray-500">Chức vụ khác nhau</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{warehouse.totalInventoryItems}</div>
                <div className="text-sm text-gray-500">Sản phẩm tồn kho</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position Distribution */}
      {staffList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Phân bố chức vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(positionCounts).map(([pos, count]) => (
                <div
                  key={pos}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1.5
                    ${getPositionBadgeColor(pos as StaffPositionEnum)}`}
                >
                  {getPositionIcon(pos as StaffPositionEnum)}
                  {STAFF_POSITION_LABELS[pos as StaffPositionEnum] || pos}
                  <span className="ml-1 font-bold">({count})</span>
                  {SYSTEM_ACCESS_POSITIONS.includes(pos as StaffPositionEnum) && (
                    <Monitor className="w-3 h-3 ml-0.5 opacity-60" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Danh sách nhân viên
              </CardTitle>
              <CardDescription>Tổng {staffTotalCount} nhân viên trong kho</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setTransferSearch(""); setDialogMode("assign"); }}>
                <Plus className="w-4 h-4 mr-1" />
                Thêm NV có sẵn
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogMode("create")}>
                <UserPlus className="w-4 h-4 mr-1" />
                Tạo tài khoản mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm nhân viên theo tên, email, mã NV..."
              value={staffSearch}
              onChange={(e) => { setStaffSearch(e.target.value); setStaffPage(1); }}
              className="pl-10"
            />
          </div>

          {staffLoading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Chưa có nhân viên nào trong kho hàng này</p>
              <p className="text-sm mt-1">Bắt đầu bằng cách tạo tài khoản mới hoặc thêm nhân viên có sẵn</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Hệ thống</TableHead>
                  <TableHead>Quyền hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.staffMemberId} className={!staff.isActive ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          {staff.avatarUrl ? (
                            <img src={staff.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-emerald-700 font-medium text-sm">
                              {(staff.fullName || staff.email || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{staff.fullName || staff.email}</p>
                          <p className="text-xs text-gray-500">{staff.employeeCode} • {staff.department || "General"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getPositionBadgeColor(staff.staffPositionEnum)}`}>
                        {getPositionIcon(staff.staffPositionEnum)}
                        {staff.staffPositionLabel || STAFF_POSITION_LABELS[staff.staffPositionEnum as StaffPositionEnum] || staff.position || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {checkCanAccessSystem(staff.staffPositionEnum) ? (
                        <Badge variant="default" className="bg-emerald-600">
                          <Monitor className="w-3 h-3 mr-1" />
                          Có
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-gray-500">
                          Không
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.isActive ? "default" : "destructive"}>
                        {staff.isActive ? "Hoạt động" : "Vô hiệu"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <SimplePagination
            currentPage={staffPage}
            totalPages={staffTotalPages}
            totalItems={staffTotalCount}
            pageSize={10}
            onPageChange={setStaffPage}
            itemLabel="nhân viên"
          />
        </CardContent>
      </Card>

      {/* ========== CREATE DIALOG ========== */}
      <Dialog open={dialogMode === "create"} onOpenChange={(v) => !v && setDialogMode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản nhân viên mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới và tự động gán vào kho "{warehouse.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
            </div>

            {/* Position select */}
            <div>
              <Label>Chức vụ *</Label>
              <Select
                value={createForm.staffPositionEnum}
                onValueChange={(v) => setCreateForm(f => ({ ...f, staffPositionEnum: v as StaffPositionEnum }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chức vụ" />
                </SelectTrigger>
                <SelectContent>
                  {(positions.length > 0 ? positions : Object.entries(STAFF_POSITION_LABELS).map(([value, label]) => ({
                    value: value as StaffPositionEnum,
                    label,
                    canAccessSystem: SYSTEM_ACCESS_POSITIONS.includes(value as StaffPositionEnum),
                    description: "",
                    numericValue: 0,
                  }))).map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        {p.label}
                        {p.canAccessSystem && (
                          <span className="text-xs text-emerald-600 font-medium">(Truy cập HT)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {checkCanAccessSystem(createForm.staffPositionEnum) && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  Chức vụ này được phép truy cập hệ thống staff
                </p>
              )}
              {!checkCanAccessSystem(createForm.staffPositionEnum) && (
                <p className="text-xs text-gray-400 mt-1">
                  Chức vụ này không được truy cập hệ thống staff
                </p>
              )}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)} disabled={createLoading}>
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
        </DialogContent>
      </Dialog>

      {/* ========== EDIT DIALOG ========== */}
      <Dialog open={dialogMode === "edit"} onOpenChange={(v) => { if (!v) { setDialogMode(null); setEditingStaff(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
            <DialogDescription>
              {editingStaff?.fullName || editingStaff?.email} ({editingStaff?.employeeCode})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                  {(positions.length > 0 ? positions : Object.entries(STAFF_POSITION_LABELS).map(([value, label]) => ({
                    value: value as StaffPositionEnum,
                    label,
                    canAccessSystem: SYSTEM_ACCESS_POSITIONS.includes(value as StaffPositionEnum),
                    description: "",
                    numericValue: 0,
                  }))).map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        {p.label}
                        {p.canAccessSystem && (
                          <span className="text-xs text-emerald-600">(Truy cập HT)</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {checkCanAccessSystem(editForm.staffPositionEnum) && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  Được phép truy cập hệ thống staff
                </p>
              )}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); setEditingStaff(null); }} disabled={editLoading}>
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
        </DialogContent>
      </Dialog>

      {/* ========== TRANSFER DIALOG ========== */}
      <Dialog open={dialogMode === "transfer"} onOpenChange={(v) => { if (!v) { setDialogMode(null); setSelectedStaffForTransfer(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chuyển nhân viên sang kho khác</DialogTitle>
          </DialogHeader>

          {selectedStaffForTransfer && (
            <div className="space-y-4">
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
                      .filter(w => w.id !== warehouse.id)
                      .map(w => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.code}) {w.region ? `- ${getRegionLabel(w.region)}` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogMode(null); setSelectedStaffForTransfer(null); }}>
                  Hủy
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedTransferTarget}
                  onClick={handleTransferStaff}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-1" />
                  Chuyển nhân viên
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== ASSIGN EXISTING STAFF DIALOG ========== */}
      <Dialog open={dialogMode === "assign"} onOpenChange={(v) => !v && setDialogMode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm nhân viên có sẵn</DialogTitle>
            <DialogDescription>
              Thêm nhân viên có sẵn trong hệ thống vào kho "{warehouse.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
                        {staff.employeeCode} •{" "}
                        <span className={`inline-flex items-center gap-0.5 ${getPositionBadgeColor(staff.staffPositionEnum)} px-1 rounded`}>
                          {STAFF_POSITION_LABELS[staff.staffPositionEnum as StaffPositionEnum] || staff.position || "Staff"}
                        </span>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================
// MAIN STAFF MANAGEMENT TAB
// =====================================================

export function StaffManagementTab() {
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;

  // Selected warehouse → navigate to staff management
  const [selectedWarehouse, setSelectedWarehouse] = useState<AdminWarehouse | null>(null);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const result: PagedWarehouses = await warehouseService.getWarehouses({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        region: regionFilter === "all" ? undefined : regionFilter || undefined,
        isActive: true, // Only show active warehouses for staff management
      });
      setWarehouses(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalCount);
    } catch {
      toast.error("Không thể tải danh sách kho hàng");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, regionFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await warehouseService.getWarehouseStats();
      setStats(data);
    } catch {
      console.error("Failed to load warehouse stats");
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
    loadStats();
  }, [loadWarehouses, loadStats]);

  // If a warehouse is selected, show staff management
  if (selectedWarehouse) {
    return (
      <WarehouseStaffPage
        warehouse={selectedWarehouse}
        onBack={() => {
          setSelectedWarehouse(null);
          loadWarehouses();
          loadStats();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HardHat className="w-6 h-6 text-orange-600" />
          Quản lý nhân viên
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Chọn kho hàng để quản lý nhân viên. Mỗi kho hàng có đội ngũ riêng với các chức vụ khác nhau.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Warehouse className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.activeWarehouses}</div>
                  <div className="text-sm text-gray-500">Kho đang hoạt động</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalStaffAssigned}</div>
                  <div className="text-sm text-gray-500">Tổng nhân viên</div>
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
                  <div className="text-sm text-gray-500">Khu vực</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Region filter buttons */}
      {stats && Object.keys(stats.warehousesByRegion).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lọc theo khu vực
            </CardTitle>
            <CardDescription>Nhấn vào khu vực để lọc danh sách kho hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm kho hàng theo tên, mã kho, thành phố..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="pl-10"
        />
      </div>

      {/* Warehouse cards grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Warehouse className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Không tìm thấy kho hàng nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <Card
              key={wh.id}
              className="cursor-pointer hover:shadow-lg hover:border-emerald-300 transition-all group"
              onClick={() => setSelectedWarehouse(wh)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition">
                      <Warehouse className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{wh.name}</h3>
                      <p className="text-xs text-gray-500">{wh.code}</p>
                    </div>
                  </div>
                  {wh.region && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRegionColor(wh.region)}`}>
                      {getRegionLabel(wh.region)}
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[wh.addressDistrict, wh.addressCity].filter(Boolean).join(", ") || "Chưa cập nhật"}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold">{wh.staffCount}</span>
                    <span className="text-gray-500">nhân viên</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium group-hover:underline">
                    Quản lý →
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        itemLabel="kho hàng"
      />
    </div>
  );
}
