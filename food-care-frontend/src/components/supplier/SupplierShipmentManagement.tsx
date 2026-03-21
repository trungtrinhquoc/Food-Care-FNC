import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Send,
  Truck,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Search,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { shipmentsApi, productsApi, warehousesApi } from '@/services/supplier/supplierApi';
import type { 
  SupplierShipment,
  CreateShipmentRequest,
  CreateShipmentItemRequest,
  SupplierProduct as ApiSupplierProduct
} from '@/services/supplier/supplierApi';

// Extended interface with items
interface ShipmentItem {
  productId: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  expiryDate?: string;
  batchNumber?: string;
}

// Remove the local interface, use API types directly with our extended items
type ShipmentDetail = SupplierShipment;

export const SupplierShipmentManagement: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [shipments, setShipments] = useState<SupplierShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [products, setProducts] = useState<ApiSupplierProduct[]>([]);
  const [createFormData, setCreateFormData] = useState<{
    warehouseId: string;
    estimatedArrival: string;
    items: ShipmentItem[];
    notes: string;
    trackingNumber: string;
  }>({
    warehouseId: '',
    estimatedArrival: '',
    items: [],
    notes: '',
    trackingNumber: '',
  });
  const [saving, setSaving] = useState(false);

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDetail | null>(null);

  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadShipments();
    loadProducts();
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const data = await warehousesApi.getAvailable();
      setWarehouses(data.map(w => ({ id: w.id, name: w.name })));
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const loadShipments = async () => {
    setLoading(true);
    try {
      const data = await shipmentsApi.getShipments(1, 100);
      setShipments(data.items || []);
    } catch (error) {
      console.error('Error loading shipments:', error);
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsApi.getProducts();
      setProducts(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleCreateShipment = async () => {
    if (!createFormData.warehouseId || !createFormData.estimatedArrival) {
      toast.error('Please fill in required fields');
      return;
    }

    if (createFormData.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      const request: CreateShipmentRequest = {
        externalReference: `SHIP-${Date.now()}`, // Generate reference
        warehouseId: createFormData.warehouseId,
        expectedDeliveryDate: createFormData.estimatedArrival,
        trackingNumber: createFormData.trackingNumber || undefined,
        notes: createFormData.notes || undefined,
        items: createFormData.items.map((item): CreateShipmentItemRequest => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitPrice,
          expiryDate: item.expiryDate,
          batchNumber: item.batchNumber,
        })),
      };

      await shipmentsApi.createShipment(request);
      setShowCreateDialog(false);
      resetCreateForm();
      await loadShipments();
      toast.success('Shipment created successfully');
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async (id: string) => {
    try {
      await shipmentsApi.startDelivering(id);
      await loadShipments();
      toast.success('Shipment dispatched');
    } catch (error) {
      console.error('Error dispatching:', error);
      toast.error('Failed to dispatch shipment');
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      await shipmentsApi.startDelivering(id);
      await loadShipments();
      toast.success('Đã gửi yêu cầu duyệt lô hàng');
    } catch (error: unknown) {
      console.error('Error submitting for approval:', error);
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Gửi yêu cầu duyệt thất bại';
      toast.error(msg);
    }
  };

  const handleViewDetail = async (shipment: SupplierShipment) => {
    // In production, fetch full details with items
    setSelectedShipment({
      ...shipment,
      items: [], // Would be populated from API
    });
    setShowDetailDialog(true);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      warehouseId: '',
      estimatedArrival: '',
      items: [],
      notes: '',
      trackingNumber: '',
    });
  };

  const addItem = () => {
    setCreateFormData({
      ...createFormData,
      items: [...createFormData.items, {
        productId: '',
        quantity: 1,
        unitPrice: 0,
      }],
    });
  };

  const updateItem = (index: number, field: keyof ShipmentItem, value: string | number) => {
    const newItems = [...createFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product is selected, auto-fill product info
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].productSku = product.sku;
        newItems[index].unitPrice = product.price || 0;
      }
    }
    
    setCreateFormData({ ...createFormData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = createFormData.items.filter((_, i) => i !== index);
    setCreateFormData({ ...createFormData, items: newItems });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      Draft: { variant: 'outline', icon: <Package className="h-3 w-3" />, label: 'Nháp' },
      Submitted: { variant: 'secondary', icon: <Send className="h-3 w-3" />, label: 'Chờ duyệt' },
      AdminApproved: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Đã duyệt' },
      AdminRejected: { variant: 'destructive', icon: <Package className="h-3 w-3" />, label: 'Bị từ chối' },
      Dispatched: { variant: 'secondary', icon: <Send className="h-3 w-3" />, label: 'Đã gửi' },
      InTransit: { variant: 'default', icon: <Truck className="h-3 w-3" />, label: 'Đang vận chuyển' },
      Arrived: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Đã đến kho' },
      Received: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Đã nhận' },
      OnHold: { variant: 'secondary', icon: <Package className="h-3 w-3" />, label: 'Tạm dừng' },
      Cancelled: { variant: 'destructive', icon: <Package className="h-3 w-3" />, label: 'Đã hủy' },
    };

    const config = statusMap[status] || { variant: 'outline' as const, icon: <Package className="h-3 w-3" />, label: status };
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.externalReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: shipments.length,
    draft: shipments.filter(s => s.status === 'Draft').length,
    submitted: shipments.filter(s => s.status === 'Submitted').length,
    approved: shipments.filter(s => s.status === 'AdminApproved').length,
    rejected: shipments.filter(s => s.status === 'AdminRejected').length,
    dispatched: shipments.filter(s => s.status === 'Dispatched').length,
    inTransit: shipments.filter(s => s.status === 'InTransit').length,
    arrived: shipments.filter(s => s.status === 'Arrived' || s.status === 'Received').length,
    onHold: shipments.filter(s => s.status === 'OnHold').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shipment Management</h1>
          <p className="text-muted-foreground">
            Create and manage your shipments to warehouses
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Shipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Shipments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <p className="text-sm text-muted-foreground">Draft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
            <p className="text-sm text-muted-foreground">Chờ duyệt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Đã duyệt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.dispatched}</div>
            <p className="text-sm text-muted-foreground">Dispatched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.inTransit}</div>
            <p className="text-sm text-muted-foreground">In Transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.arrived}</div>
            <p className="text-sm text-muted-foreground">Arrived/Received</p>
          </CardContent>
        </Card>
        {stats.rejected > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-sm text-muted-foreground">Bị từ chối</p>
            </CardContent>
          </Card>
        )}
        {stats.onHold > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.onHold}</div>
              <p className="text-sm text-muted-foreground">Tạm dừng</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by shipment number or warehouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Dispatched">Dispatched</SelectItem>
                <SelectItem value="InTransit">In Transit</SelectItem>
                <SelectItem value="Arrived">Arrived</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment #</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Expected Arrival</TableHead>
                  <TableHead>Actual Arrival</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No shipments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.externalReference}
                      </TableCell>
                      <TableCell>{shipment.warehouseName}</TableCell>
                      <TableCell>{shipment.totalItems || '-'}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(shipment.totalValue || 0)}
                      </TableCell>
                      <TableCell>
                        {shipment.expectedDeliveryDate
                          ? new Date(shipment.expectedDeliveryDate).toLocaleDateString('vi-VN')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {shipment.actualArrivalDate
                          ? new Date(shipment.actualArrivalDate).toLocaleDateString('vi-VN')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(shipment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {shipment.status === 'Draft' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/supplier/shipments/${shipment.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                onClick={() => handleSubmitForApproval(shipment.id)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Gửi duyệt
                              </Button>
                            </>
                          )}
                          {shipment.status === 'AdminApproved' && (
                            <Button
                              size="sm"
                              onClick={() => handleDispatch(shipment.id)}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Dispatch
                            </Button>
                          )}
                          {shipment.status === 'AdminRejected' && shipment.rejectionReason && (
                            <span className="text-xs text-red-600 max-w-[150px] truncate" title={shipment.rejectionReason}>
                              Lý do: {shipment.rejectionReason}
                            </span>
                          )}
                          {shipment.status === 'OnHold' && shipment.adminHoldReason && (
                            <span className="text-xs text-amber-600 max-w-[150px] truncate" title={shipment.adminHoldReason}>
                              Lý do: {shipment.adminHoldReason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Shipment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
            <DialogDescription>
              Create a shipment to send products to a warehouse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Warehouse *</Label>
                <Select
                  value={createFormData.warehouseId}
                  onValueChange={(value) => 
                    setCreateFormData({ ...createFormData, warehouseId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Arrival Date *</Label>
                <Input
                  type="date"
                  value={createFormData.estimatedArrival}
                  onChange={(e) => 
                    setCreateFormData({ ...createFormData, estimatedArrival: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tracking Number</Label>
                <Input
                  value={createFormData.trackingNumber}
                  onChange={(e) => 
                    setCreateFormData({ ...createFormData, trackingNumber: e.target.value })
                  }
                  placeholder="Enter tracking number"
                />
              </div>
            </div>

            <Separator />

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Shipment Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {createFormData.items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                  No items added. Click "Add Item" to start.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createFormData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateItem(index, 'productId', value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => 
                              updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => 
                              updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.batchNumber || ''}
                            onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                            placeholder="Batch #"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={item.expiryDate || ''}
                            onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                            className="w-36"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.quantity * item.unitPrice)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => removeItem(index)}
                          >
                            ×
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {createFormData.items.length > 0 && (
                <div className="flex justify-end mt-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(
                        createFormData.items.reduce(
                          (sum, item) => sum + item.quantity * item.unitPrice,
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={createFormData.notes}
                onChange={(e) => 
                  setCreateFormData({ ...createFormData, notes: e.target.value })
                }
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShipment} disabled={saving}>
              {saving ? 'Creating...' : 'Create Shipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Shipment Details - {selectedShipment?.externalReference}
            </DialogTitle>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{selectedShipment.warehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedShipment.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Arrival</p>
                  <p className="font-medium">
                    {selectedShipment.expectedDeliveryDate
                      ? new Date(selectedShipment.expectedDeliveryDate).toLocaleDateString('vi-VN')
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Arrival</p>
                  <p className="font-medium">
                    {selectedShipment.actualArrivalDate
                      ? new Date(selectedShipment.actualArrivalDate).toLocaleDateString('vi-VN')
                      : 'Not arrived'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tracking Number</p>
                  <p className="font-medium">
                    {selectedShipment.trackingNumber || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(selectedShipment.totalValue || 0)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Timeline */}
              <div>
                <h4 className="font-medium mb-4">Shipment Timeline</h4>
                <div className="relative pl-8 space-y-4">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-muted"></div>
                  
                  <div className="relative">
                    <div className="absolute -left-5 w-4 h-4 rounded-full bg-green-500"></div>
                    <p className="font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedShipment.createdAt
                        ? new Date(selectedShipment.createdAt).toLocaleString('vi-VN')
                        : '-'
                      }
                    </p>
                  </div>

                  {selectedShipment.actualDispatchDate && (
                    <div className="relative">
                      <div className="absolute -left-5 w-4 h-4 rounded-full bg-blue-500"></div>
                      <p className="font-medium">Dispatched</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedShipment.actualDispatchDate).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}

                  {selectedShipment.actualArrivalDate && (
                    <div className="relative">
                      <div className="absolute -left-5 w-4 h-4 rounded-full bg-green-500"></div>
                      <p className="font-medium">Arrived</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedShipment.actualArrivalDate).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierShipmentManagement;
