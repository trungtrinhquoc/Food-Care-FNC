import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SectionHeader } from './SupplierLayout';
import { MapPin, Package, RefreshCw, ChevronDown, ChevronUp, Truck, Users } from 'lucide-react';
import { deliveryBatchesApi, type DeliveryBatch } from '../../services/supplier/supplierApi';
import { toast } from 'sonner';

export function DeliveryBatchesSection() {
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await deliveryBatchesApi.getBatches();
      setBatches(data);
    } catch {
      toast.error('Không thể tải dữ liệu lô giao hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const toggleDistrict = (district: string) => {
    setExpandedDistricts((prev) => {
      const next = new Set(prev);
      if (next.has(district)) {
        next.delete(district);
      } else {
        next.add(district);
      }
      return next;
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const totalOrders = batches.reduce((sum, b) => sum + b.orderCount, 0);
  const totalAmount = batches.reduce((sum, b) => sum + b.totalAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Lô giao hàng theo khu vực"
        description="Nhóm đơn hàng theo quận/huyện để tối ưu giao hàng"
        actions={
          <Button variant="outline" onClick={loadBatches} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Làm mới
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Khu vực</p>
                <p className="text-2xl font-bold">{batches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng giá trị</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch List */}
      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có lô giao hàng nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const isExpanded = expandedDistricts.has(batch.district);
            return (
              <Card key={batch.district}>
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDistrict(batch.district)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      {batch.district}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {batch.orderCount} đơn
                      </Badge>
                      <span className="font-semibold text-green-600">{formatCurrency(batch.totalAmount)}</span>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="space-y-3">
                      {batch.orders.map((order) => (
                        <div key={order.orderId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">#{order.orderNumber}</span>
                              <Badge variant="outline" className="text-xs">{order.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                            <p className="text-xs text-gray-400">{order.customerAddress}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                            <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
