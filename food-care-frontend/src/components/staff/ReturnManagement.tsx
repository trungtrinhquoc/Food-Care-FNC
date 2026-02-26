import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, RefreshCw, Plus, Eye, CheckCircle, Clock, Truck, Package,
  Undo2, CreditCard, XCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { returnApi, shipmentApi } from '@/services/staff/staffApi';
import type {
  ReturnShipment, CreateReturnRequest, CreateReturnItemRequest,
  SupplierShipment, PagedResponse,
} from '@/types/staff';

// ===== STATUS BADGE =====
const ReturnStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className?: string }> = {
    draft: { variant: 'outline', icon: Clock },
    pending_approval: { variant: 'secondary', icon: Clock },
    approved: { variant: 'default', icon: CheckCircle, className: 'bg-blue-500' },
    shipped: { variant: 'default', icon: Truck, className: 'bg-purple-500' },
    received: { variant: 'default', icon: Package, className: 'bg-indigo-500' },
    credit_issued: { variant: 'default', icon: CreditCard, className: 'bg-green-500' },
    closed: { variant: 'outline', icon: CheckCircle },
    cancelled: { variant: 'destructive', icon: XCircle },
  };
  const c = config[status] || config.draft;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className={`flex items-center gap-1 w-fit ${c.className || ''}`}>
      <Icon className="h-3 w-3" /> {status.replace(/_/g, ' ')}
    </Badge>
  );
};

const RETURN_REASONS = [
  'Damaged', 'Wrong Item', 'Wrong Quantity', 'Quality Issue',
  'Expired', 'Customer Return', 'Defective', 'Other',
];

export const ReturnManagement: React.FC = () => {
  const [returns, setReturns] = useState<ReturnShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [shipments, setShipments] = useState<SupplierShipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<SupplierShipment | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [returnItems, setReturnItems] = useState<CreateReturnItemRequest[]>([]);

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnShipment | null>(null);

  // Ship dialog
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [shipTrackingNumber, setShipTrackingNumber] = useState('');
  const [shipCarrier, setShipCarrier] = useState('');
  const [shipping, setShipping] = useState(false);

  // Action states
  const [approving, setApproving] = useState(false);
  const [receiving, setReceiving] = useState(false);

  // ===== DATA LOADING =====
  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const response: PagedResponse<ReturnShipment> = await returnApi.getAll(1, 100, status);
      setReturns(response.items || []);
    } catch (error) {
      console.error('Error loading returns:', error);
      toast.error('Failed to load return shipments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadShipments = useCallback(async () => {
    try {
      const [inspected, stored, closed] = await Promise.all([
        shipmentApi.getAll(1, 50, undefined, undefined, 'Inspected'),
        shipmentApi.getAll(1, 50, undefined, undefined, 'Stored'),
        shipmentApi.getAll(1, 50, undefined, undefined, 'Closed'),
      ]);
      setShipments([...inspected.items, ...stored.items, ...closed.items]);
    } catch (error) {
      console.error('Error loading shipments:', error);
    }
  }, []);

  useEffect(() => { loadReturns(); }, [loadReturns]);

  // ===== ACTIONS =====
  const handleOpenCreate = async () => {
    await loadShipments();
    setSelectedShipmentId('');
    setSelectedShipment(null);
    setReturnReason('');
    setReturnDescription('');
    setReturnItems([]);
    setShowCreateDialog(true);
  };

  const handleShipmentSelect = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      setSelectedShipment(shipment);
      setReturnItems(
        (shipment.items || []).map(item => ({
          productId: item.productId,
          shipmentItemId: item.id,
          quantity: 0,
          batchNumber: item.batchNumber || undefined,
          returnReason: 'Damaged',
          description: '',
        }))
      );
    }
  };

  const handleCreate = async () => {
    if (!selectedShipmentId || !returnReason) {
      toast.error('Please fill in all required fields');
      return;
    }
    const itemsToReturn = returnItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      toast.error('At least one item must have a return quantity');
      return;
    }
    setCreating(true);
    try {
      const request: CreateReturnRequest = {
        originalShipmentId: selectedShipmentId,
        returnReason,
        description: returnDescription || undefined,
        items: itemsToReturn,
      };
      await returnApi.create(request);
      setShowCreateDialog(false);
      toast.success('Return shipment created');
      loadReturns();
    } catch (error) {
      console.error('Error creating return:', error);
      toast.error('Failed to create return shipment');
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApproving(true);
    try {
      await returnApi.approve(id);
      toast.success('Return approved');
      loadReturns();
    } catch (error) {
      console.error('Error approving return:', error);
      toast.error('Failed to approve return');
    } finally {
      setApproving(false);
    }
  };

  const handleShip = async () => {
    if (!selectedReturn || !shipTrackingNumber) {
      toast.error('Please enter tracking number');
      return;
    }
    setShipping(true);
    try {
      await returnApi.ship(selectedReturn.id, shipTrackingNumber, shipCarrier || undefined);
      setShowShipDialog(false);
      setShipTrackingNumber('');
      setShipCarrier('');
      toast.success('Return shipped');
      loadReturns();
    } catch (error) {
      console.error('Error shipping return:', error);
      toast.error('Failed to mark as shipped');
    } finally {
      setShipping(false);
    }
  };

  const handleMarkReceived = async (id: string) => {
    setReceiving(true);
    try {
      await returnApi.markReceived(id);
      toast.success('Return marked as received by supplier');
      loadReturns();
    } catch (error) {
      console.error('Error marking received:', error);
      toast.error('Failed to mark as received');
    } finally {
      setReceiving(false);
    }
  };

  const openDetailDialog = async (id: string) => {
    try {
      const data = await returnApi.getById(id);
      setSelectedReturn(data);
      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error loading return:', error);
      toast.error('Failed to load details');
    }
  };

  const openShipDialog = (ret: ReturnShipment) => {
    setSelectedReturn(ret);
    setShipTrackingNumber('');
    setShipCarrier('');
    setShowShipDialog(true);
  };

  // ===== HELPERS =====
  const updateItemField = (index: number, field: keyof CreateReturnItemRequest, value: string | number) => {
    setReturnItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const filteredReturns = returns.filter(r =>
    r.returnNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.originalShipmentReference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: returns.length,
    pending: returns.filter(r => ['draft', 'pending_approval'].includes(r.status)).length,
    inTransit: returns.filter(r => r.status === 'shipped').length,
    completed: returns.filter(r => ['credit_issued', 'closed'].includes(r.status)).length,
    totalValue: returns.reduce((sum, r) => sum + (r.totalValue || 0), 0),
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  const formatDateTime = (date: string) => new Date(date).toLocaleString('vi-VN');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Return Management</h1>
          <p className="text-muted-foreground">Manage return shipments to suppliers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReturns}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" /> New Return</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Undo2 className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">Total Returns</span></div>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-orange-600" /><span className="text-sm text-muted-foreground">Pending</span></div>
            <p className="text-2xl font-bold mt-2 text-orange-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-blue-600" /><span className="text-sm text-muted-foreground">In Transit</span></div>
            <p className="text-2xl font-bold mt-2 text-blue-600">{stats.inTransit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span className="text-sm text-muted-foreground">Completed</span></div>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by return #, supplier, shipment..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="credit_issued">Credit Issued</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardHeader><CardTitle>Return Shipments ({filteredReturns.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No return shipments found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return #</TableHead>
                  <TableHead>Original Shipment</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-medium">{ret.returnNumber}</TableCell>
                    <TableCell>{ret.originalShipmentReference || '-'}</TableCell>
                    <TableCell>{ret.supplierName || '-'}</TableCell>
                    <TableCell><ReturnStatusBadge status={ret.status} /></TableCell>
                    <TableCell className="max-w-[150px] truncate">{ret.returnReason}</TableCell>
                    <TableCell className="text-right">{ret.totalItems}</TableCell>
                    <TableCell className="text-right font-bold">{ret.totalQuantity}</TableCell>
                    <TableCell className="text-right">{ret.totalValue ? formatCurrency(ret.totalValue) : '-'}</TableCell>
                    <TableCell>{ret.trackingNumber || '-'}</TableCell>
                    <TableCell>{formatDateTime(ret.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openDetailDialog(ret.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {['draft', 'pending_approval'].includes(ret.status) && (
                          <Button size="sm" onClick={() => handleApprove(ret.id)} disabled={approving}>
                            Approve
                          </Button>
                        )}
                        {ret.status === 'approved' && (
                          <Button size="sm" onClick={() => openShipDialog(ret)}>
                            <Truck className="h-4 w-4 mr-1" /> Ship
                          </Button>
                        )}
                        {ret.status === 'shipped' && (
                          <Button size="sm" onClick={() => handleMarkReceived(ret.id)} disabled={receiving}>
                            Received
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ===== CREATE DIALOG ===== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Return Shipment</DialogTitle>
            <DialogDescription>Return items to supplier from a previous shipment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Original Shipment *</Label>
                <Select value={selectedShipmentId} onValueChange={handleShipmentSelect}>
                  <SelectTrigger><SelectValue placeholder="Select shipment" /></SelectTrigger>
                  <SelectContent>
                    {shipments.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.externalReference} - {s.supplierName} ({s.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Return Reason *</Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={returnDescription} onChange={(e) => setReturnDescription(e.target.value)}
                placeholder="Additional details about the return..." rows={2} />
            </div>

            {/* Items */}
            {returnItems.length > 0 && (
              <div>
                <Label className="mb-2 block">Items to Return</Label>
                <Alert className="mb-2">
                  <AlertDescription>Set quantity &gt; 0 for items you want to return.</AlertDescription>
                </Alert>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">Return Qty</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnItems.map((item, index) => {
                        const shipmentItem = selectedShipment?.items.find(si => si.id === item.shipmentItemId);
                        return (
                          <TableRow key={index} className={item.quantity > 0 ? 'bg-blue-50' : ''}>
                            <TableCell className="font-medium">{shipmentItem?.productName || `Product ${index + 1}`}</TableCell>
                            <TableCell>{item.batchNumber || '-'}</TableCell>
                            <TableCell className="text-right">{shipmentItem?.expectedQuantity || shipmentItem?.quantity || 0}</TableCell>
                            <TableCell>
                              <Input type="number" className="w-20 text-right" min={0}
                                max={shipmentItem?.expectedQuantity || shipmentItem?.quantity || 0}
                                value={item.quantity}
                                onChange={(e) => updateItemField(index, 'quantity', parseInt(e.target.value) || 0)} />
                            </TableCell>
                            <TableCell>
                              <Select value={item.returnReason} onValueChange={(v) => updateItemField(index, 'returnReason', v)}>
                                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {RETURN_REASONS.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input value={item.description || ''} placeholder="Notes..."
                                onChange={(e) => updateItemField(index, 'description', e.target.value)} className="w-[150px]" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 text-right text-sm text-muted-foreground">
                  Total return quantity: <strong>{returnItems.reduce((sum, i) => sum + i.quantity, 0)}</strong>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !selectedShipmentId || !returnReason || returnItems.every(i => i.quantity === 0)}>
              {creating ? 'Creating...' : 'Create Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DETAIL DIALOG ===== */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Return Shipment Details</DialogTitle>
            <DialogDescription>{selectedReturn?.returnNumber}</DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Status</p><ReturnStatusBadge status={selectedReturn.status} /></div>
                <div><p className="text-sm text-muted-foreground">Return Reason</p><p className="font-medium">{selectedReturn.returnReason}</p></div>
                <div><p className="text-sm text-muted-foreground">Original Shipment</p><p className="font-medium">{selectedReturn.originalShipmentReference || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Supplier</p><p className="font-medium">{selectedReturn.supplierName || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Warehouse</p><p className="font-medium">{selectedReturn.warehouseName || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Created By</p><p className="font-medium">{selectedReturn.creatorName || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{formatDateTime(selectedReturn.createdAt)}</p></div>
                {selectedReturn.approvedAt && (
                  <div><p className="text-sm text-muted-foreground">Approved By</p><p className="font-medium">{selectedReturn.approverName || '-'} ({formatDateTime(selectedReturn.approvedAt)})</p></div>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{selectedReturn.totalItems}</p>
                  <p className="text-sm text-muted-foreground">Items</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{selectedReturn.totalQuantity}</p>
                  <p className="text-sm text-muted-foreground">Total Qty</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{selectedReturn.totalValue ? formatCurrency(selectedReturn.totalValue) : '-'}</p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedReturn.creditAmount ? formatCurrency(selectedReturn.creditAmount) : '-'}</p>
                  <p className="text-sm text-muted-foreground">Credit Amount</p>
                </div>
              </div>

              {/* Shipping info */}
              {(selectedReturn.trackingNumber || selectedReturn.shippedAt) && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Shipping Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Tracking #</p><p className="font-medium">{selectedReturn.trackingNumber || '-'}</p></div>
                    <div><p className="text-muted-foreground">Carrier</p><p className="font-medium">{selectedReturn.carrier || '-'}</p></div>
                    <div><p className="text-muted-foreground">Shipped At</p><p className="font-medium">{selectedReturn.shippedAt ? formatDateTime(selectedReturn.shippedAt) : '-'}</p></div>
                    <div><p className="text-muted-foreground">Supplier Received</p><p className="font-medium">{selectedReturn.supplierReceivedAt ? formatDateTime(selectedReturn.supplierReceivedAt) : '-'}</p></div>
                  </div>
                </div>
              )}

              {/* Credit info */}
              {selectedReturn.creditAmount && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Credit Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Credit Status</p><p className="font-medium">{selectedReturn.creditStatus || '-'}</p></div>
                    <div><p className="text-muted-foreground">Credit Amount</p><p className="font-bold text-green-600">{formatCurrency(selectedReturn.creditAmount)}</p></div>
                    <div><p className="text-muted-foreground">Credit Issued</p><p className="font-medium">{selectedReturn.creditIssuedAt ? formatDateTime(selectedReturn.creditIssuedAt) : '-'}</p></div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedReturn.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="bg-muted p-3 rounded-lg">{selectedReturn.description}</p>
                </div>
              )}

              {/* Items */}
              {selectedReturn.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Return Items ({selectedReturn.items.length})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Line Total</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName || '-'}</TableCell>
                          <TableCell>{item.batchNumber || '-'}</TableCell>
                          <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                          <TableCell>{item.returnReason}</TableCell>
                          <TableCell className="text-right">{item.unitCost ? formatCurrency(item.unitCost) : '-'}</TableCell>
                          <TableCell className="text-right">{item.lineTotal ? formatCurrency(item.lineTotal) : '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== SHIP DIALOG ===== */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ship Return</DialogTitle>
            <DialogDescription>Enter shipping details for {selectedReturn?.returnNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Supplier</p><p className="font-medium">{selectedReturn?.supplierName}</p></div>
                <div><p className="text-muted-foreground">Total Items</p><p className="font-bold">{selectedReturn?.totalQuantity} units</p></div>
              </div>
            </div>
            <div>
              <Label>Tracking Number *</Label>
              <Input value={shipTrackingNumber} onChange={(e) => setShipTrackingNumber(e.target.value)} placeholder="Enter tracking number" />
            </div>
            <div>
              <Label>Carrier</Label>
              <Input value={shipCarrier} onChange={(e) => setShipCarrier(e.target.value)} placeholder="e.g., VNPost, GHTK, GHN..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShipDialog(false)}>Cancel</Button>
            <Button onClick={handleShip} disabled={shipping || !shipTrackingNumber}>
              {shipping ? 'Processing...' : (
                <><Truck className="h-4 w-4 mr-2" />Confirm Shipment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnManagement;
