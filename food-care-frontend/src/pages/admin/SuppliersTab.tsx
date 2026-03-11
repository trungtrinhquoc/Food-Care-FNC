import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { SimplePagination } from "../../components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Plus, Edit, Trash2, Search, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { SupplierStatusBadge } from "../../components/ui/status-badge";
import { SupplierDialog } from "../../components/admin/SupplierDialog";
import type { Supplier, SupplierFormData } from "../../types/admin";
import { suppliersService } from "../../services/admin";

// Vietnamese provinces/cities for region extraction
const KNOWN_REGIONS = [
  'Hà Nội', 'TP.HCM', 'Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Thành phố Hồ Chí Minh',
  'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai',
  'Long An', 'Bà Rịa - Vũng Tàu', 'Vũng Tàu', 'Bắc Ninh', 'Hưng Yên',
  'Hải Dương', 'Thanh Hóa', 'Nghệ An', 'Huế', 'Thừa Thiên Huế',
  'Quảng Nam', 'Quảng Ngãi', 'Bình Định', 'Khánh Hòa', 'Nha Trang',
  'Lâm Đồng', 'Đà Lạt', 'Gia Lai', 'Đắk Lắk', 'Tây Ninh',
  'Bình Phước', 'Tiền Giang', 'Bến Tre', 'Vĩnh Long', 'An Giang',
  'Kiên Giang', 'Phú Quốc', 'Sóc Trăng', 'Trà Vinh', 'Bạc Liêu',
  'Cà Mau', 'Đồng Tháp', 'Hậu Giang', 'Lào Cai', 'Yên Bái',
  'Phú Thọ', 'Vĩnh Phúc', 'Thái Nguyên', 'Bắc Giang', 'Quảng Ninh',
  'Lạng Sơn', 'Nam Định', 'Ninh Bình', 'Thái Bình', 'Hà Nam',
  'Tân Bình', 'Bình Tân', 'Thủ Đức', 'Gò Vấp', 'Tân Phú',
];

/** Extract region from supplier address */
function extractRegion(address: string): string {
  if (!address) return 'Không xác định';
  const normalized = address.trim();
  for (const region of KNOWN_REGIONS) {
    if (normalized.toLowerCase().includes(region.toLowerCase())) {
      // Normalize TP.HCM variants
      if (['hồ chí minh', 'tp.hcm', 'tp. hồ chí minh', 'thành phố hồ chí minh'].includes(region.toLowerCase())) {
        return 'TP.HCM';
      }
      if (['huế', 'thừa thiên huế'].includes(region.toLowerCase())) {
        return 'Thừa Thiên Huế';
      }
      if (['nha trang'].includes(region.toLowerCase())) {
        return 'Khánh Hòa';
      }
      if (['đà lạt'].includes(region.toLowerCase())) {
        return 'Lâm Đồng';
      }
      if (['phú quốc'].includes(region.toLowerCase())) {
        return 'Kiên Giang';
      }
      if (['vũng tàu'].includes(region.toLowerCase())) {
        return 'Bà Rịa - Vũng Tàu';
      }
      return region;
    }
  }
  return 'Khác';
}

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string; products: { id: string; name: string }[] } | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    addressStreet: "",
    addressWard: "",
    addressDistrict: "",
    addressCity: "",
    contact: "",
    products: "",
  });
  const pageSize = 5;

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await suppliersService.getSuppliers({
        page: 1,
        pageSize: 100,
        searchTerm: searchTerm || undefined,
      });
      setSuppliers(res.items);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error('Không thể tải danh sách nhà cung cấp');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Extract unique regions from supplier addresses
  const availableRegions = useMemo(() => {
    const regionSet = new Set<string>();
    suppliers.forEach((s) => {
      regionSet.add(extractRegion(s.address));
    });
    return Array.from(regionSet).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion =
        selectedRegion === 'all' || extractRegion(s.address) === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [suppliers, searchTerm, selectedRegion]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(startIndex, startIndex + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  const handleAdd = useCallback(() => {
    setEditingSupplier(null);
    setSupplierForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      addressStreet: "",
      addressWard: "",
      addressDistrict: "",
      addressCity: "",
      contact: "",
      products: "",
    });
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      addressStreet: "",
      addressWard: "",
      addressDistrict: "",
      addressCity: "",
      contact: supplier.contact,
      products: supplier.products.join(", "),
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (supplierId: string) => {
    if (!confirm("Bạn có chắc muốn xóa nhà cung cấp này?")) return;
    try {
      await suppliersService.deleteSupplier(supplierId);
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      if (selectedSupplier?.id === supplierId) setSelectedSupplier(null);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error('Không thể xóa nhà cung cấp');
    }
  }, [selectedSupplier]);

  const handleSave = useCallback(async () => {
    try {
      if (!supplierForm.name || !supplierForm.phone) {
        return;
      }

      if (editingSupplier) {
        await suppliersService.updateSupplier(editingSupplier.id, {
          name: supplierForm.name,
          email: supplierForm.email,
          phone: supplierForm.phone,
          address: supplierForm.address,
          contact: supplierForm.contact,
          status: "active",
        });
      } else {
        await suppliersService.createSupplier({
          name: supplierForm.name,
          email: supplierForm.email,
          phone: supplierForm.phone,
          address: supplierForm.address,
          contact: supplierForm.contact,
        });
      }

      setIsDialogOpen(false);
      setEditingSupplier(null);
      await fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error('Không thể lưu nhà cung cấp');
    }
  }, [editingSupplier, fetchSuppliers, supplierForm]);

  const updateSupplierForm = useCallback((field: keyof SupplierFormData, value: string) => {
    setSupplierForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleViewSupplier = useCallback(async (supplier: Supplier) => {
    try {
      const detail = await suppliersService.getSupplierDetail(supplier.id);
      setSelectedSupplier({
        id: String(detail.id),
        name: detail.name,
        products: detail.products.map(p => ({ id: p.id, name: p.name })),
      });
    } catch (error) {
      console.error('Error fetching supplier detail:', error);
      toast.error('Không thể tải chi tiết nhà cung cấp');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý nhà cung cấp</CardTitle>
              <CardDescription>Tổng {suppliers.length} nhà cung cấp</CardDescription>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhà cung cấp
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[220px]">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Select
                value={selectedRegion}
                onValueChange={(val) => {
                  setSelectedRegion(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Lọc theo khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khu vực</SelectItem>
                  {availableRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRegion !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2"
                  onClick={() => {
                    setSelectedRegion('all');
                    setCurrentPage(1);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedSupplier && (
            <Card className="mb-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-gray-500">Nhà cung cấp</div>
                    <div className="text-lg font-semibold">{selectedSupplier.name}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedSupplier(null)}>
                    Đóng
                  </Button>
                </div>
                <div className="text-sm text-gray-600 mb-2">Sản phẩm cung cấp</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.products.length === 0 ? (
                    <span className="text-sm text-gray-500">Chưa có sản phẩm</span>
                  ) : (
                    selectedSupplier.products.map(p => (
                      <Badge key={p.id} variant="outline">{p.name}</Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="space-y-4">
            {paginatedSuppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          type="button"
                          onClick={() => handleViewSupplier(supplier)}
                          className="text-lg font-semibold text-left hover:underline"
                        >
                          {supplier.name}
                        </button>
                        <SupplierStatusBadge status={supplier.status} />
                      </div>
                      <div className="text-sm text-gray-600 mb-3 space-y-1">
                        <div>📧 {supplier.email}</div>
                        <div>📱 {supplier.phone}</div>
                        <div>📍 {supplier.address}</div>
                        <div>👤 Người liên hệ: {supplier.contact}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {supplier.products.map((product, idx) => (
                          <Badge key={idx} variant="outline">
                            {product}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">
                        Tổng {supplier.totalProducts} sản phẩm
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(supplier.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredSuppliers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="nhà cung cấp"
          />
        </CardContent>
      </Card>

      {/* Supplier Dialog */}
      <SupplierDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingSupplier={editingSupplier}
        onSave={handleSave}
        supplierForm={supplierForm}
        onUpdateForm={updateSupplierForm}
      />
    </>
  );
}
