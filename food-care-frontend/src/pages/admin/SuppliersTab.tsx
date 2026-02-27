import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/admin/Button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { SimplePagination } from "../../components/ui/pagination";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SupplierStatusBadge } from "../../components/ui/status-badge";
import { SupplierDialog } from "../../components/admin/SupplierDialog";
import type { Supplier, SupplierFormData } from "../../types/admin";
import { suppliersService } from "../../services/admin";

export function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string; products: { id: string; name: string }[] } | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
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

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

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
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 max-w-sm"
            />
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
