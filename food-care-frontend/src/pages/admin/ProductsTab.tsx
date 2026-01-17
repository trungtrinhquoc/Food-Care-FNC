import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { StockBadge } from "../../components/admin/BadgeComponents";
import type { Product } from "../../types";

interface ProductsTabProps {
  products: Product[];
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export function ProductsTab({ products, onAdd, onEdit, onDelete }: ProductsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý sản phẩm</CardTitle>
            <CardDescription>Tổng {products.length} sản phẩm</CardDescription>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm sản phẩm
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {product.price.toLocaleString('vi-VN')}đ
                    </div>
                    {product.originalPrice && (
                      <div className="text-xs text-gray-500 line-through">
                        {product.originalPrice.toLocaleString('vi-VN')}đ
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>
                  <StockBadge stock={product.stock} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span>⭐ {product.rating}</span>
                    <span className="text-xs text-gray-500">({product.reviews})</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(product.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
