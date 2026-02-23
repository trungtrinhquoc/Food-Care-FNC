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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, Search, AlertTriangle, RefreshCw, Plus, Minus, Eye, Calendar,
  Warehouse, Filter, ArrowRightLeft, ShieldAlert, Skull, History, ArrowDown, ArrowUp,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { inventoryApi, warehouseApi, staffMemberApi } from '@/services/staff/staffApi';
import type {
  WarehouseInventory, Warehouse as WarehouseType, AdjustInventoryRequest,
  TransferInventoryRequest, StockMovement, PagedResponse,
} from '@/types/staff';

// ===== INVENTORY TYPE BADGE =====
const InventoryTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    Available: { variant: 'default', className: 'bg-green-500' },
    Reserved: { variant: 'secondary', className: 'bg-blue-500 text-white' },
    Quarantine: { variant: 'secondary', className: 'bg-yellow-500 text-white' },
    Damaged: { variant: 'destructive' },
    Expired: { variant: 'destructive', className: 'bg-gray-600' },
  };
  const c = config[type] || { variant: 'outline' as const };
  return <Badge variant={c.variant} className={c.className}>{type}</Badge>;
};

// ===== MOVEMENT TYPE BADGE =====
const MovementTypeBadge: React.FC<{ type: string; quantity: number }> = ({ type, quantity }) => {
  const isPositive = quantity > 0;
  return (
    <Badge variant={isPositive ? 'default' : 'destructive'} className="flex items-center gap-1 w-fit">
      {isPositive ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
      {type}
    </Badge>
  );
};

export const InventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [inventory, setInventory] = useState<WarehouseInventory[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]); // For transfer target selector
  const [warehouseName, setWarehouseName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Adjust dialog
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WarehouseInventory | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Transfer dialog
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferTargetWarehouse, setTransferTargetWarehouse] = useState('');
  const [transferQty, setTransferQty] = useState(0);
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);

  // Quarantine dialog
  const [showQuarantineDialog, setShowQuarantineDialog] = useState(false);
  const [quarantineReason, setQuarantineReason] = useState('');
  const [quarantining, setQuarantining] = useState(false);

  // Mark Expired dialog
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  const [expiredReason, setExpiredReason] = useState('');
  const [markingExpired, setMarkingExpired] = useState(false);

  // Movements state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Low stock & expiring
  const [lowStockItems, setLowStockItems] = useState<WarehouseInventory[]>([]);
  const [expiringItems, setExpiringItems] = useState<WarehouseInventory[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // ===== DATA LOADING =====
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const inventoryType = typeFilter !== 'all' ? typeFilter : undefined;
      const lowStock = stockFilter === 'low' ? true : undefined;
      const nearExpiry = stockFilter === 'expiring' ? true : undefined;

      const [inventoryResponse, warehouseResponse, profile] = await Promise.all([
        inventoryApi.getAll(1, 100, undefined, undefined, inventoryType, lowStock, nearExpiry),
        warehouseApi.getAll(1, 100, true),
        staffMemberApi.getMe(),
      ]);
      setInventory(inventoryResponse.items || []);
      setWarehouses(warehouseResponse.items || []);
      setWarehouseName(profile.warehouseName || 'Chưa gán kho');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, stockFilter]);

  const loadMovements = useCallback(async () => {
    setLoadingMovements(true);
    try {
      const response: PagedResponse<StockMovement> = await inventoryApi.getMovements(undefined, movementsPage, 50);
      setMovements(response.items || []);
      setMovementsTotal(response.totalPages || 0);
    } catch (error) {
      console.error('Error loading movements:', error);
      toast.error('Failed to load stock movements');
    } finally {
      setLoadingMovements(false);
    }
  }, [movementsPage]);

  const loadAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const [low, expiring] = await Promise.all([
        inventoryApi.getLowStock(),
        inventoryApi.getExpiring(30),
      ]);
      setLowStockItems(low || []);
      setExpiringItems(expiring || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (activeTab === 'movements') loadMovements(); }, [activeTab, loadMovements]);
  useEffect(() => { if (activeTab === 'low-stock' || activeTab === 'expiring') loadAlerts(); }, [activeTab, loadAlerts]);

  // ===== ACTIONS =====
  const handleAdjustStock = async () => {
    if (!selectedItem || adjustmentQty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    setAdjusting(true);
    try {
      const request: AdjustInventoryRequest = {
        quantity: adjustmentType === 'add' ? adjustmentQty : -adjustmentQty,
        reason: adjustmentReason || `Manual ${adjustmentType === 'add' ? 'addition' : 'subtraction'}`,
      };
      await inventoryApi.adjust(selectedItem.id, request);
      await loadData();
      setShowAdjustDialog(false);
      resetAdjustmentForm();
      toast.success('Stock adjusted successfully');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedItem || transferQty <= 0 || !transferTargetWarehouse) {
      toast.error('Please fill in all required fields');
      return;
    }
    setTransferring(true);
    try {
      const request: TransferInventoryRequest = {
        targetWarehouseId: transferTargetWarehouse,
        quantity: transferQty,
        reason: transferReason || 'Warehouse transfer',
      };
      await inventoryApi.transfer(selectedItem.id, request);
      await loadData();
      setShowTransferDialog(false);
      resetTransferForm();
      toast.success('Inventory transferred successfully');
    } catch (error) {
      console.error('Error transferring inventory:', error);
      toast.error('Failed to transfer inventory');
    } finally {
      setTransferring(false);
    }
  };

  const handleQuarantine = async () => {
    if (!selectedItem) return;
    setQuarantining(true);
    try {
      await inventoryApi.adjust(selectedItem.id, {
        quantity: -selectedItem.availableQuantity,
        reason: quarantineReason || 'Moved to quarantine',
        notes: 'Quality hold - moved to quarantine',
      });
      await loadData();
      setShowQuarantineDialog(false);
      setQuarantineReason('');
      toast.success('Item placed in quarantine');
    } catch (error) {
      console.error('Error quarantining inventory:', error);
      toast.error('Failed to quarantine item');
    } finally {
      setQuarantining(false);
    }
  };

  const handleMarkExpired = async () => {
    if (!selectedItem) return;
    setMarkingExpired(true);
    try {
      await inventoryApi.adjust(selectedItem.id, {
        quantity: -selectedItem.availableQuantity,
        reason: expiredReason || 'Marked as expired',
        notes: 'Product has expired',
      });
      await loadData();
      setShowExpiredDialog(false);
      setExpiredReason('');
      toast.success('Item marked as expired');
    } catch (error) {
      console.error('Error marking as expired:', error);
      toast.error('Failed to mark as expired');
    } finally {
      setMarkingExpired(false);
    }
  };

  // ===== HELPERS =====
  const resetAdjustmentForm = () => {
    setSelectedItem(null);
    setAdjustmentType('add');
    setAdjustmentQty(0);
    setAdjustmentReason('');
  };

  const resetTransferForm = () => {
    setTransferTargetWarehouse('');
    setTransferQty(0);
    setTransferReason('');
  };

  const openAdjustDialog = (item: WarehouseInventory, type: 'add' | 'subtract') => {
    setSelectedItem(item);
    setAdjustmentType(type);
    setShowAdjustDialog(true);
  };

  const openDetailDialog = (item: WarehouseInventory) => {
    setSelectedItem(item);
    setShowDetailDialog(true);
  };

  const openTransferDialog = (item: WarehouseInventory) => {
    setSelectedItem(item);
    setShowTransferDialog(true);
  };

  const openQuarantineDialog = (item: WarehouseInventory) => {
    setSelectedItem(item);
    setShowQuarantineDialog(true);
  };

  const openExpiredDialog = (item: WarehouseInventory) => {
    setSelectedItem(item);
    setShowExpiredDialog(true);
  };

  const getStockStatusBadge = (item: WarehouseInventory) => {
    if (item.quantity <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (item.isLowStock || (item.minQuantity && item.quantity <= item.minQuantity))
      return <Badge variant="secondary" className="bg-orange-500 text-white">Low Stock</Badge>;
    if (item.maxQuantity && item.quantity >= item.maxQuantity)
      return <Badge className="bg-blue-500">Overstocked</Badge>;
    return <Badge className="bg-green-500">In Stock</Badge>;
  };

  const isExpiringSoon = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) <= new Date();
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && (item.isLowStock || (item.minQuantity && item.quantity <= item.minQuantity))) ||
      (stockFilter === 'out' && item.quantity <= 0) ||
      (stockFilter === 'expiring' && (item.isExpiringSoon || isExpiringSoon(item.expiryDate))) ||
      (stockFilter === 'normal' && item.quantity > (item.minQuantity || 0));
    return matchesSearch && matchesStock;
  });

  const stats = {
    totalItems: inventory.length,
    totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
    lowStock: inventory.filter(item => item.isLowStock || (item.minQuantity && item.quantity <= item.minQuantity)).length,
    outOfStock: inventory.filter(item => item.quantity <= 0).length,
    expiringSoon: inventory.filter(item => item.isExpiringSoon || isExpiringSoon(item.expiryDate)).length,
    quarantine: inventory.filter(item => item.inventoryType === 'Quarantine').length,
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');
  const formatDateTime = (date: string) => new Date(date).toLocaleString('vi-VN');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor and manage warehouse inventory, stock movements, and alerts</p>
        </div>
        <Button variant="outline" onClick={() => { loadData(); if (activeTab === 'movements') loadMovements(); if (activeTab === 'low-stock' || activeTab === 'expiring') loadAlerts(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => { setStockFilter('all'); setActiveTab('all'); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">Total SKUs</span></div>
            <p className="text-2xl font-bold mt-2">{stats.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Warehouse className="h-5 w-5 text-blue-600" /><span className="text-sm text-muted-foreground">Total Units</span></div>
            <p className="text-2xl font-bold mt-2">{stats.totalQuantity.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setActiveTab('low-stock')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-600" /><span className="text-sm text-muted-foreground">Low Stock</span></div>
            <p className="text-2xl font-bold mt-2 text-orange-600">{stats.lowStock}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => { setStockFilter('out'); setActiveTab('all'); }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Package className="h-5 w-5 text-red-600" /><span className="text-sm text-muted-foreground">Out of Stock</span></div>
            <p className="text-2xl font-bold mt-2 text-red-600">{stats.outOfStock}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-gray-50" onClick={() => setActiveTab('expiring')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-yellow-600" /><span className="text-sm text-muted-foreground">Expiring Soon</span></div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.expiringSoon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-purple-600" /><span className="text-sm text-muted-foreground">Quarantine</span></div>
            <p className="text-2xl font-bold mt-2 text-purple-600">{stats.quarantine}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.lowStock > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.lowStock} item(s) are running low on stock. Consider restocking soon.
            {stats.expiringSoon > 0 && ` ${stats.expiringSoon} item(s) expiring within 30 days.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="h-4 w-4" /> All Inventory
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Stock Movements
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Low Stock
            {stats.lowStock > 0 && <Badge variant="destructive" className="ml-1">{stats.lowStock}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="expiring" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Expiring
            {stats.expiringSoon > 0 && <Badge variant="secondary" className="bg-yellow-500 text-white ml-1">{stats.expiringSoon}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ===== ALL INVENTORY TAB ===== */}
        <TabsContent value="all">
          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by product name, SKU, or batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm font-medium whitespace-nowrap">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <span>Kho: {warehouseName}</span>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Inventory Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                    <SelectItem value="Quarantine">Quarantine</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Stock status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="normal">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Inventory Items ({filteredInventory.length})</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No inventory items found</TableCell></TableRow>
                    ) : (
                      filteredInventory.map((item) => (
                        <TableRow key={item.id} className={item.quantity <= 0 ? 'bg-red-50' : isExpired(item.expiryDate) ? 'bg-gray-100' : isExpiringSoon(item.expiryDate) ? 'bg-yellow-50' : ''}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.productSku || '-'}</TableCell>
                          <TableCell>{item.warehouseName}</TableCell>
                          <TableCell><InventoryTypeBadge type={item.inventoryType} /></TableCell>
                          <TableCell>{item.batchNumber || '-'}</TableCell>
                          <TableCell>
                            {item.expiryDate ? (
                              <span className={isExpired(item.expiryDate) ? 'text-red-600 font-bold' : isExpiringSoon(item.expiryDate) ? 'text-orange-600 font-medium' : ''}>
                                {formatDate(item.expiryDate)}
                                {isExpired(item.expiryDate) && ' ❌'}
                                {!isExpired(item.expiryDate) && isExpiringSoon(item.expiryDate) && ' ⚠️'}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                          <TableCell className="text-right text-green-600">{item.availableQuantity}</TableCell>
                          <TableCell className="text-right text-blue-600">{item.reservedQuantity || 0}</TableCell>
                          <TableCell>{getStockStatusBadge(item)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" title="View Details" onClick={() => openDetailDialog(item)}><Eye className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" title="Add Stock" onClick={() => openAdjustDialog(item, 'add')}><Plus className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" title="Remove Stock" onClick={() => openAdjustDialog(item, 'subtract')} disabled={item.quantity <= 0}><Minus className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" title="Transfer" onClick={() => openTransferDialog(item)} disabled={item.availableQuantity <= 0}><ArrowRightLeft className="h-3 w-3" /></Button>
                              {item.inventoryType === 'Available' && (
                                <Button size="sm" variant="outline" title="Quarantine" onClick={() => openQuarantineDialog(item)} disabled={item.availableQuantity <= 0}><ShieldAlert className="h-3 w-3" /></Button>
                              )}
                              {item.expiryDate && isExpired(item.expiryDate) && (
                                <Button size="sm" variant="destructive" title="Mark Expired" onClick={() => openExpiredDialog(item)}><Skull className="h-3 w-3" /></Button>
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
        </TabsContent>

        {/* ===== STOCK MOVEMENTS TAB ===== */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> Stock Movements / Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMovements ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No stock movements found</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Movement Type</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                        <TableHead className="text-right">Before</TableHead>
                        <TableHead className="text-right">After</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Performed By</TableHead>
                        <TableHead>FIFO Override</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((mv) => (
                        <TableRow key={mv.id}>
                          <TableCell className="text-sm">{formatDateTime(mv.createdAt)}</TableCell>
                          <TableCell className="font-medium">{mv.productName || '-'}</TableCell>
                          <TableCell>{mv.warehouseName || '-'}</TableCell>
                          <TableCell><MovementTypeBadge type={mv.movementType} quantity={mv.quantityChange} /></TableCell>
                          <TableCell className={`text-right font-bold ${mv.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {mv.quantityChange > 0 ? '+' : ''}{mv.quantityChange}
                          </TableCell>
                          <TableCell className="text-right">{mv.quantityBefore}</TableCell>
                          <TableCell className="text-right">{mv.quantityAfter}</TableCell>
                          <TableCell>{mv.batchNumber || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={mv.reason || mv.notes || ''}>{mv.reason || mv.notes || '-'}</TableCell>
                          <TableCell>{mv.performedByName || '-'}</TableCell>
                          <TableCell>
                            {mv.isFifoOverride && (
                              <Badge variant="secondary" className="bg-purple-500 text-white">Override</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Page {movementsPage} of {movementsTotal || 1}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={movementsPage <= 1} onClick={() => setMovementsPage(p => p - 1)}>Previous</Button>
                      <Button size="sm" variant="outline" disabled={movementsPage >= movementsTotal} onClick={() => setMovementsPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== LOW STOCK TAB ===== */}
        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" /> Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAlerts ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-green-600 font-medium">✅ All items are sufficiently stocked</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead className="text-right">Current Qty</TableHead>
                      <TableHead className="text-right">Min Level</TableHead>
                      <TableHead className="text-right">Deficit</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id} className="bg-orange-50">
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.productSku || '-'}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell>{item.batchNumber || '-'}</TableCell>
                        <TableCell className="text-right font-bold text-orange-600">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.minQuantity || item.reorderPoint || '-'}</TableCell>
                        <TableCell className="text-right text-red-600 font-bold">
                          {(item.minQuantity || item.reorderPoint || 0) - item.quantity > 0
                            ? `-${(item.minQuantity || item.reorderPoint || 0) - item.quantity}`
                            : '-'}
                        </TableCell>
                        <TableCell>{item.supplierName || '-'}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openAdjustDialog(item, 'add')}>
                            <Plus className="h-4 w-4 mr-1" /> Restock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== EXPIRING SOON TAB ===== */}
        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-600" /> Expiring Within 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAlerts ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : expiringItems.length === 0 ? (
                <div className="text-center py-8 text-green-600 font-medium">✅ No items expiring within 30 days</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Days Left</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringItems.map((item) => {
                      const daysLeft = item.daysUntilExpiry ?? (item.expiryDate
                        ? Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0);
                      const isAlreadyExpired = daysLeft <= 0;
                      return (
                        <TableRow key={item.id} className={isAlreadyExpired ? 'bg-red-50' : daysLeft <= 7 ? 'bg-orange-50' : 'bg-yellow-50'}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.productSku || '-'}</TableCell>
                          <TableCell>{item.warehouseName}</TableCell>
                          <TableCell>{item.batchNumber || '-'}</TableCell>
                          <TableCell className={isAlreadyExpired ? 'text-red-600 font-bold' : 'text-orange-600 font-medium'}>
                            {item.expiryDate ? formatDate(item.expiryDate) : '-'}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${isAlreadyExpired ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-yellow-600'}`}>
                            {isAlreadyExpired ? 'EXPIRED' : `${daysLeft} days`}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.unitCost ? formatCurrency(item.unitCost * item.quantity) : '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {isAlreadyExpired ? (
                                <Button size="sm" variant="destructive" onClick={() => openExpiredDialog(item)}>
                                  <Skull className="h-4 w-4 mr-1" /> Mark Expired
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => openQuarantineDialog(item)}>
                                  <ShieldAlert className="h-4 w-4 mr-1" /> Quarantine
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== STOCK ADJUSTMENT DIALOG ===== */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}</DialogTitle>
            <DialogDescription>Adjust inventory for {selectedItem?.productName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Quantity</p>
                  <p className="text-xl font-bold">{selectedItem?.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">After Adjustment</p>
                  <p className={`text-xl font-bold ${adjustmentType === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                    {adjustmentType === 'add' ? (selectedItem?.quantity || 0) + adjustmentQty : (selectedItem?.quantity || 0) - adjustmentQty}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label>Quantity to {adjustmentType === 'add' ? 'Add' : 'Remove'} *</Label>
              <Input type="number" min={1} max={adjustmentType === 'subtract' ? selectedItem?.quantity : undefined}
                value={adjustmentQty} onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Reason *</Label>
              <Textarea value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="Enter reason for adjustment..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>Cancel</Button>
            <Button onClick={handleAdjustStock} disabled={adjusting || adjustmentQty <= 0 || !adjustmentReason}
              className={adjustmentType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {adjusting ? 'Processing...' : `${adjustmentType === 'add' ? 'Add' : 'Remove'} Stock`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== TRANSFER DIALOG ===== */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Inventory</DialogTitle>
            <DialogDescription>Transfer {selectedItem?.productName} to another warehouse</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">From Warehouse</p>
                  <p className="font-medium">{selectedItem?.warehouseName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Available Quantity</p>
                  <p className="text-xl font-bold">{selectedItem?.availableQuantity}</p>
                </div>
              </div>
            </div>
            <div>
              <Label>Target Warehouse *</Label>
              <Select value={transferTargetWarehouse} onValueChange={setTransferTargetWarehouse}>
                <SelectTrigger><SelectValue placeholder="Select target warehouse" /></SelectTrigger>
                <SelectContent>
                  {warehouses.filter(wh => wh.id !== selectedItem?.warehouseId).map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity to Transfer *</Label>
              <Input type="number" min={1} max={selectedItem?.availableQuantity}
                value={transferQty} onChange={(e) => setTransferQty(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Reason for transfer..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={transferring || transferQty <= 0 || !transferTargetWarehouse}>
              {transferring ? 'Transferring...' : (
                <><ArrowRightLeft className="h-4 w-4 mr-2" />Transfer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== QUARANTINE DIALOG ===== */}
      <Dialog open={showQuarantineDialog} onOpenChange={setShowQuarantineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place in Quarantine</DialogTitle>
            <DialogDescription>Move {selectedItem?.productName} to quality hold</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                This will move <strong>{selectedItem?.availableQuantity}</strong> units of {selectedItem?.productName}{' '}
                from available stock to quarantine. The items will not be available for orders.
              </AlertDescription>
            </Alert>
            <div>
              <Label>Reason for Quarantine *</Label>
              <Textarea value={quarantineReason} onChange={(e) => setQuarantineReason(e.target.value)}
                placeholder="Describe the quality issue..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuarantineDialog(false)}>Cancel</Button>
            <Button onClick={handleQuarantine} disabled={quarantining || !quarantineReason}
              className="bg-yellow-600 hover:bg-yellow-700">
              {quarantining ? 'Processing...' : 'Confirm Quarantine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== MARK EXPIRED DIALOG ===== */}
      <Dialog open={showExpiredDialog} onOpenChange={setShowExpiredDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Expired</DialogTitle>
            <DialogDescription>Mark {selectedItem?.productName} as expired and remove from available stock</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <Skull className="h-4 w-4" />
              <AlertDescription>
                This will remove <strong>{selectedItem?.availableQuantity}</strong> units from available stock.
                Expiry date: <strong>{selectedItem?.expiryDate ? formatDate(selectedItem.expiryDate) : 'N/A'}</strong>
              </AlertDescription>
            </Alert>
            <div>
              <Label>Notes</Label>
              <Textarea value={expiredReason} onChange={(e) => setExpiredReason(e.target.value)}
                placeholder="Additional notes about expired product..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpiredDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleMarkExpired} disabled={markingExpired}>
              {markingExpired ? 'Processing...' : 'Confirm Mark Expired'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DETAIL DIALOG ===== */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Inventory Details</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Product</p><p className="font-medium">{selectedItem.productName}</p></div>
                <div><p className="text-sm text-muted-foreground">SKU</p><p className="font-medium">{selectedItem.productSku || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Warehouse</p><p className="font-medium">{selectedItem.warehouseName}</p></div>
                <div><p className="text-sm text-muted-foreground">Location Code</p><p className="font-medium">{selectedItem.locationCode || selectedItem.location || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Inventory Type</p><InventoryTypeBadge type={selectedItem.inventoryType} /></div>
                <div><p className="text-sm text-muted-foreground">Supplier</p><p className="font-medium">{selectedItem.supplierName || '-'}</p></div>
              </div>
              <Separator />
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{selectedItem.quantity}</p>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedItem.availableQuantity}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedItem.reservedQuantity || 0}</p>
                  <p className="text-sm text-muted-foreground">Reserved</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{selectedItem.unitCost ? formatCurrency(selectedItem.unitCost) : '-'}</p>
                  <p className="text-sm text-muted-foreground">Unit Cost</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Batch Number</p><p className="font-medium">{selectedItem.batchNumber || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className={`font-medium ${isExpired(selectedItem.expiryDate) ? 'text-red-600' : isExpiringSoon(selectedItem.expiryDate) ? 'text-orange-600' : ''}`}>
                    {selectedItem.expiryDate ? formatDate(selectedItem.expiryDate) : '-'}
                    {selectedItem.daysUntilExpiry !== undefined && ` (${selectedItem.daysUntilExpiry} days)`}
                  </p>
                </div>
                <div><p className="text-sm text-muted-foreground">Manufacture Date</p><p className="font-medium">{selectedItem.manufactureDate ? formatDate(selectedItem.manufactureDate) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Version (Optimistic Lock)</p><p className="font-medium">{selectedItem.version}</p></div>
                <div><p className="text-sm text-muted-foreground">Min Stock Level</p><p className="font-medium">{selectedItem.minQuantity || selectedItem.minStockLevel || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Max Stock Level</p><p className="font-medium">{selectedItem.maxQuantity || selectedItem.maxStockLevel || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Reorder Point</p><p className="font-medium">{selectedItem.reorderPoint || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Reorder Quantity</p><p className="font-medium">{selectedItem.reorderQuantity || '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Last Updated</p><p className="font-medium">{selectedItem.updatedAt ? formatDateTime(selectedItem.updatedAt) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p>{getStockStatusBadge(selectedItem)}</div>
              </div>
              {/* Total Value */}
              {selectedItem.unitCost && (
                <>
                  <Separator />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(selectedItem.unitCost * selectedItem.quantity)}</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
