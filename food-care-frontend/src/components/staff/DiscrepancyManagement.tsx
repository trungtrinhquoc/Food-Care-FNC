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
  AlertTriangle, Search, RefreshCw, Plus, Eye, Bell, CheckCircle, XCircle, Clock,
  FileWarning,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { discrepancyApi, shipmentApi } from '@/services/staff/staffApi';
import type {
  DiscrepancyReport, CreateDiscrepancyRequest, CreateDiscrepancyItemRequest,
  SupplierShipment, PagedResponse,
} from '@/types/staff';

// ===== STATUS BADGE =====
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
    draft: { variant: 'outline', icon: Clock },
    open: { variant: 'secondary', icon: AlertTriangle },
    pending_review: { variant: 'secondary', icon: Clock },
    approved: { variant: 'default', icon: CheckCircle },
    rejected: { variant: 'destructive', icon: XCircle },
    resolved: { variant: 'default', icon: CheckCircle },
    closed: { variant: 'outline', icon: CheckCircle },
  };
  const c = config[status] || config.open;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className="flex items-center gap-1 w-fit">
      <Icon className="h-3 w-3" /> {status.replace('_', ' ')}
    </Badge>
  );
};

// ===== DISCREPANCY TYPE BADGE =====
const DiscrepancyTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    QuantityShort: { variant: 'destructive' },
    QuantityOver: { variant: 'secondary' },
    Damaged: { variant: 'destructive' },
    QualityFailed: { variant: 'destructive' },
    WrongItem: { variant: 'secondary' },
    WrongBatch: { variant: 'outline' },
    Expired: { variant: 'destructive' },
    MissingDocuments: { variant: 'outline' },
    Other: { variant: 'outline' },
  };
  const c = config[type] || { variant: 'outline' as const };
  return <Badge variant={c.variant}>{type.replace(/([A-Z])/g, ' $1').trim()}</Badge>;
};

const DISCREPANCY_TYPES = [
  'QuantityShort', 'QuantityOver', 'Damaged', 'QualityFailed',
  'WrongItem', 'WrongBatch', 'Expired', 'MissingDocuments', 'Other',
];

const RESOLUTION_TYPES = [
  'Credit Note', 'Replacement', 'Return to Supplier', 'Accept as Is',
  'Partial Credit', 'Discount Applied', 'Other',
];

export const DiscrepancyManagement: React.FC = () => {
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [shipments, setShipments] = useState<SupplierShipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<SupplierShipment | null>(null);
  const [createType, setCreateType] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createItems, setCreateItems] = useState<CreateDiscrepancyItemRequest[]>([]);

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DiscrepancyReport | null>(null);

  // Resolve dialog
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Notify dialog
  const [notifying, setNotifying] = useState(false);

  // ===== DATA LOADING =====
  const loadDiscrepancies = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const response: PagedResponse<DiscrepancyReport> = await discrepancyApi.getAll(1, 100, status);
      setDiscrepancies(response.items || []);
    } catch (error) {
      console.error('Error loading discrepancies:', error);
      toast.error('Failed to load discrepancy reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadShipments = useCallback(async () => {
    try {
      // Load shipments for creating discrepancy reports (Arrived, Inspected, Stored)
      const [arrived, inspected, stored] = await Promise.all([
        shipmentApi.getAll(1, 50, undefined, undefined, 'Arrived'),
        shipmentApi.getAll(1, 50, undefined, undefined, 'Inspected'),
        shipmentApi.getAll(1, 50, undefined, undefined, 'Stored'),
      ]);
      setShipments([...arrived.items, ...inspected.items, ...stored.items]);
    } catch (error) {
      console.error('Error loading shipments:', error);
    }
  }, []);

  useEffect(() => { loadDiscrepancies(); }, [loadDiscrepancies]);

  // ===== ACTIONS =====
  const handleOpenCreate = async () => {
    await loadShipments();
    setSelectedShipmentId('');
    setSelectedShipment(null);
    setCreateType('');
    setCreateDescription('');
    setCreateItems([]);
    setShowCreateDialog(true);
  };

  const handleShipmentSelect = async (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      setSelectedShipment(shipment);
      // Pre-populate items from shipment
      setCreateItems(
        (shipment.items || []).map(item => ({
          productId: item.productId,
          shipmentItemId: item.id,
          discrepancyType: 'QuantityShort',
          expectedQuantity: item.expectedQuantity || item.quantity || 0,
          actualQuantity: item.expectedQuantity || item.quantity || 0,
          batchNumber: item.batchNumber || undefined,
          description: '',
        }))
      );
    }
  };

  const handleCreateDiscrepancy = async () => {
    if (!selectedShipmentId || !createType || !createDescription) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Filter items that actually have discrepancies
    const discrepancyItems = createItems.filter(item => item.expectedQuantity !== item.actualQuantity || item.description);
    if (discrepancyItems.length === 0) {
      toast.error('At least one item must have a discrepancy');
      return;
    }
    setCreating(true);
    try {
      const request: CreateDiscrepancyRequest = {
        shipmentId: selectedShipmentId,
        discrepancyType: createType,
        description: createDescription,
        items: discrepancyItems.map(item => ({
          ...item,
          discrepancyType: item.discrepancyType || createType,
        })),
      };
      await discrepancyApi.create(request);
      setShowCreateDialog(false);
      toast.success('Discrepancy report created');
      loadDiscrepancies();
    } catch (error) {
      console.error('Error creating discrepancy:', error);
      toast.error('Failed to create discrepancy report');
    } finally {
      setCreating(false);
    }
  };

  const handleNotifySupplier = async (id: string) => {
    setNotifying(true);
    try {
      await discrepancyApi.notifySupplier(id);
      toast.success('Supplier notified');
      loadDiscrepancies();
    } catch (error) {
      console.error('Error notifying supplier:', error);
      toast.error('Failed to notify supplier');
    } finally {
      setNotifying(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedReport || !resolutionType) {
      toast.error('Please select a resolution type');
      return;
    }
    setResolving(true);
    try {
      await discrepancyApi.resolve(selectedReport.id, resolutionType, resolutionNotes);
      setShowResolveDialog(false);
      setResolutionType('');
      setResolutionNotes('');
      toast.success('Discrepancy resolved');
      loadDiscrepancies();
    } catch (error) {
      console.error('Error resolving discrepancy:', error);
      toast.error('Failed to resolve discrepancy');
    } finally {
      setResolving(false);
    }
  };

  const openDetailDialog = async (id: string) => {
    try {
      const report = await discrepancyApi.getById(id);
      setSelectedReport(report);
      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error loading discrepancy:', error);
      toast.error('Failed to load details');
    }
  };

  const openResolveDialog = (report: DiscrepancyReport) => {
    setSelectedReport(report);
    setResolutionType('');
    setResolutionNotes('');
    setShowResolveDialog(true);
  };

  // ===== HELPERS =====
  const updateItemField = (index: number, field: keyof CreateDiscrepancyItemRequest, value: string | number) => {
    setCreateItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const filteredDiscrepancies = discrepancies.filter(d =>
    d.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.shipmentReference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: discrepancies.length,
    open: discrepancies.filter(d => ['open', 'draft', 'pending_review'].includes(d.status)).length,
    resolved: discrepancies.filter(d => d.status === 'resolved').length,
    totalValue: discrepancies.reduce((sum, d) => sum + (d.affectedValue || 0), 0),
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  const formatDateTime = (date: string) => new Date(date).toLocaleString('vi-VN');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discrepancy Management</h1>
          <p className="text-muted-foreground">Track and resolve shipment discrepancies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDiscrepancies}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          <Button onClick={handleOpenCreate}><Plus className="h-4 w-4 mr-2" /> New Report</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><FileWarning className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">Total Reports</span></div>
            <p className="text-2xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-600" /><span className="text-sm text-muted-foreground">Open</span></div>
            <p className="text-2xl font-bold mt-2 text-orange-600">{stats.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span className="text-sm text-muted-foreground">Resolved</span></div>
            <p className="text-2xl font-bold mt-2 text-green-600">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><span className="text-sm text-muted-foreground">Affected Value</span></div>
            <p className="text-2xl font-bold mt-2 text-red-600">{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by report #, supplier, shipment..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader><CardTitle>Discrepancy Reports ({filteredDiscrepancies.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : filteredDiscrepancies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No discrepancy reports found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Affected Qty</TableHead>
                  <TableHead className="text-right">Affected Value</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscrepancies.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.reportNumber}</TableCell>
                    <TableCell>{report.shipmentReference || '-'}</TableCell>
                    <TableCell>{report.supplierName || '-'}</TableCell>
                    <TableCell><DiscrepancyTypeBadge type={report.discrepancyType} /></TableCell>
                    <TableCell><StatusBadge status={report.status} /></TableCell>
                    <TableCell className="text-right font-bold">{report.affectedQuantity}</TableCell>
                    <TableCell className="text-right">{report.affectedValue ? formatCurrency(report.affectedValue) : '-'}</TableCell>
                    <TableCell>{report.reportedByName || '-'}</TableCell>
                    <TableCell>{formatDateTime(report.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => openDetailDialog(report.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!report.supplierNotifiedAt && ['open', 'pending_review', 'approved'].includes(report.status) && (
                          <Button size="sm" variant="outline" onClick={() => handleNotifySupplier(report.id)} disabled={notifying}>
                            <Bell className="h-4 w-4" />
                          </Button>
                        )}
                        {['open', 'pending_review', 'approved'].includes(report.status) && (
                          <Button size="sm" onClick={() => openResolveDialog(report)}>Resolve</Button>
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
            <DialogTitle>Create Discrepancy Report</DialogTitle>
            <DialogDescription>Report a discrepancy found during receiving or inspection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shipment *</Label>
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
                <Label>Discrepancy Type *</Label>
                <Select value={createType} onValueChange={setCreateType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {DISCREPANCY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Describe the discrepancy in detail..." rows={3} />
            </div>

            {/* Items */}
            {createItems.length > 0 && (
              <div>
                <Label className="mb-2 block">Affected Items</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Expected</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Difference</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {createItems.map((item, index) => {
                        const shipmentItem = selectedShipment?.items.find(si => si.id === item.shipmentItemId);
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{shipmentItem?.productName || `Product ${index + 1}`}</TableCell>
                            <TableCell>
                              <Select value={item.discrepancyType} onValueChange={(v) => updateItemField(index, 'discrepancyType', v)}>
                                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {DISCREPANCY_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">{item.expectedQuantity}</TableCell>
                            <TableCell>
                              <Input type="number" className="w-20 text-right" value={item.actualQuantity}
                                onChange={(e) => updateItemField(index, 'actualQuantity', parseInt(e.target.value) || 0)} />
                            </TableCell>
                            <TableCell className={`text-right font-bold ${item.expectedQuantity - item.actualQuantity !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {item.actualQuantity - item.expectedQuantity}
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
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateDiscrepancy} disabled={creating || !selectedShipmentId || !createType || !createDescription}>
              {creating ? 'Creating...' : 'Create Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DETAIL DIALOG ===== */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discrepancy Report Details</DialogTitle>
            <DialogDescription>{selectedReport?.reportNumber}</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Status</p><StatusBadge status={selectedReport.status} /></div>
                <div><p className="text-sm text-muted-foreground">Type</p><DiscrepancyTypeBadge type={selectedReport.discrepancyType} /></div>
                <div><p className="text-sm text-muted-foreground">Shipment</p><p className="font-medium">{selectedReport.shipmentReference || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Supplier</p><p className="font-medium">{selectedReport.supplierName || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Affected Quantity</p><p className="font-bold text-red-600">{selectedReport.affectedQuantity}</p></div>
                <div><p className="text-sm text-muted-foreground">Affected Value</p><p className="font-bold text-red-600">{selectedReport.affectedValue ? formatCurrency(selectedReport.affectedValue) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Reported By</p><p className="font-medium">{selectedReport.reportedByName || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{formatDateTime(selectedReport.createdAt)}</p></div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="bg-muted p-3 rounded-lg">{selectedReport.description}</p>
              </div>

              {/* Supplier notification */}
              {selectedReport.supplierNotifiedAt && (
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    Supplier notified on {formatDateTime(selectedReport.supplierNotifiedAt)}
                    {selectedReport.supplierResponse && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="text-sm font-medium">Supplier Response ({selectedReport.supplierResponseAt ? formatDateTime(selectedReport.supplierResponseAt) : ''}):</p>
                        <p className="text-sm">{selectedReport.supplierResponse}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Resolution */}
              {selectedReport.resolutionType && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Resolution</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Resolution Type</p><p className="font-medium">{selectedReport.resolutionType}</p></div>
                    <div><p className="text-muted-foreground">Resolved By</p><p className="font-medium">{selectedReport.resolvedByName || '-'}</p></div>
                    <div><p className="text-muted-foreground">Resolved At</p><p className="font-medium">{selectedReport.resolvedAt ? formatDateTime(selectedReport.resolvedAt) : '-'}</p></div>
                  </div>
                  {selectedReport.resolutionNotes && (
                    <p className="mt-2 text-sm">{selectedReport.resolutionNotes}</p>
                  )}
                </div>
              )}

              {/* Items */}
              {selectedReport.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Affected Items ({selectedReport.items.length})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Expected</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Discrepancy</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReport.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName || '-'}</TableCell>
                          <TableCell><DiscrepancyTypeBadge type={item.discrepancyType} /></TableCell>
                          <TableCell className="text-right">{item.expectedQuantity}</TableCell>
                          <TableCell className="text-right">{item.actualQuantity}</TableCell>
                          <TableCell className="text-right font-bold text-red-600">{item.discrepancyQuantity}</TableCell>
                          <TableCell>{item.batchNumber || '-'}</TableCell>
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
            {selectedReport && ['open', 'pending_review', 'approved'].includes(selectedReport.status) && (
              <Button onClick={() => { setShowDetailDialog(false); openResolveDialog(selectedReport); }}>
                Resolve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== RESOLVE DIALOG ===== */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Discrepancy</DialogTitle>
            <DialogDescription>Report: {selectedReport?.reportNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Type</p><p className="font-medium">{selectedReport?.discrepancyType}</p></div>
                <div><p className="text-muted-foreground">Supplier</p><p className="font-medium">{selectedReport?.supplierName}</p></div>
                <div><p className="text-muted-foreground">Affected Qty</p><p className="font-bold text-red-600">{selectedReport?.affectedQuantity}</p></div>
                <div><p className="text-muted-foreground">Value</p><p className="font-bold text-red-600">{selectedReport?.affectedValue ? formatCurrency(selectedReport.affectedValue) : '-'}</p></div>
              </div>
            </div>
            <div>
              <Label>Resolution Type *</Label>
              <Select value={resolutionType} onValueChange={setResolutionType}>
                <SelectTrigger><SelectValue placeholder="Select resolution type" /></SelectTrigger>
                <SelectContent>
                  {RESOLUTION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resolution Notes</Label>
              <Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Details about the resolution..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={resolving || !resolutionType}>
              {resolving ? 'Resolving...' : (
                <><CheckCircle className="h-4 w-4 mr-2" />Resolve</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscrepancyManagement;
