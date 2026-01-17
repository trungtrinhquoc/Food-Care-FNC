import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { StatusBadge } from "../../components/admin/BadgeComponents";
import type { Supplier } from "../../types/admin";

interface SuppliersTabProps {
  suppliers: Supplier[];
  onAdd: () => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
}

export function SuppliersTab({ suppliers, onAdd, onEdit, onDelete }: SuppliersTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý nhà cung cấp</CardTitle>
            <CardDescription>Tổng {suppliers.length} nhà cung cấp</CardDescription>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm nhà cung cấp
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{supplier.name}</h3>
                      <StatusBadge status={supplier.status} />
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
                    <Button variant="outline" size="sm" onClick={() => onEdit(supplier)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(supplier.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
