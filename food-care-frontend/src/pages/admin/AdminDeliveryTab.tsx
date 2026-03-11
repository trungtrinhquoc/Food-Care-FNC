import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  Truck,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  Package,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminDeliveryApi } from '../../services/admin/adminDeliveryApi';
import type {
  AdminDeliverySummary,
  AdminDeliveryDetail,
} from '../../types/shipping';
import { SHIPMENT_STATUS_CONFIG as STATUS_CONFIG } from '../../types/shipping';

export function AdminDeliveryTab() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingDeliveries, setPendingDeliveries] = useState<AdminDeliverySummary[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<AdminDeliverySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState(false);

  // Detail modal
  const [detailModal, setDetailModal] = useState<AdminDeliveryDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{ id: string; ref: string; type: 'shipment' | 'session' } | null>(null);

  // Pagination
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [allPage, setAllPage] = useState(1);
  const [allTotal, setAllTotal] = useState(0);
  const PAGE_SIZE = 15;

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminDeliveryApi.getPendingDeliveries(pendingPage, PAGE_SIZE);
      setPendingDeliveries(data.items || []);
      setPendingTotal(data.totalCount ?? data.totalItems ?? 0);
    } catch (error) {
      console.error('Error loading pending deliveries:', error);
      toast.error('Kh\u00f4ng th\u1ec3 t\u1ea3i danh s\u00e1ch \u0111ang giao');
    } finally {
      setLoading(false);
    }
  }, [pendingPage]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminDeliveryApi.getDeliveries({
        page: allPage,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setAllDeliveries(data.items || []);
      setAllTotal(data.totalCount ?? data.totalItems ?? 0);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast.error('Kh\u00f4ng th\u1ec3 t\u1ea3i danh s\u00e1ch giao h\u00e0ng');
    } finally {
      setLoading(false);
    }
  }, [allPage, statusFilter, searchTerm]);

  useEffect(() => {
    if (activeTab === 'pending') loadPending();
    else loadAll();
  }, [activeTab, loadPending, loadAll]);

  const openDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const detail = await adminDeliveryApi.getDeliveryDetail(id);
      setDetailModal(detail);
    } catch {
      toast.error('Kh\u00f4ng th\u1ec3 t\u1ea3i chi ti\u1ebft');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      setProcessing(true);
      if (deleteModal.type === 'shipment') {
        await adminDeliveryApi.deleteShipment(deleteModal.id);
        toast.success('\u0110\u00e3 x\u00f3a l\u00f4 h\u00e0ng');
      } else {
        await adminDeliveryApi.deleteSession(deleteModal.id);
        toast.success('\u0110\u00e3 x\u00f3a phi\u00ean nh\u1eadp');
      }
      setDeleteModal(null);
      setDetailModal(null);
      loadPending();
      loadAll();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Thao t\u00e1c th\u1ea5t b\u1ea1i';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    return <Badge className={`${cfg.bgColor} ${cfg.color} border-0`}>{cfg.label}</Badge>;
  };

  const renderDeliveryTable = (deliveries: AdminDeliverySummary[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>M\u00e3 l\u00f4</TableHead>
          <TableHead>NCC</TableHead>
          <TableHead>Kho</TableHead>
          <TableHead>Tr\u1ea1ng th\u00e1i</TableHead>
          <TableHead className="text-right">SL SP</TableHead>
          <TableHead className="text-right">Gi\u00e1 tr\u1ecb</TableHead>
          <TableHead>Ng\u00e0y giao d\u1ef1 ki\u1ebfn</TableHead>
          <TableHead className="text-center">Thao t\u00e1c</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deliveries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
              Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u
            </TableCell>
          </TableRow>
        ) : (
          deliveries.map((d) => (
            <TableRow key={d.id} className="hover:bg-slate-50">
              <TableCell className="font-mono text-xs">{d.externalReference}</TableCell>
              <TableCell className="max-w-[120px] truncate">{d.supplierName}</TableCell>
              <TableCell className="max-w-[120px] truncate">{d.warehouseName}</TableCell>
              <TableCell>{getStatusBadge(d.status)}</TableCell>
              <TableCell className="text-right">{d.totalItems}</TableCell>
              <TableCell className="text-right">{(d.totalValue || 0).toLocaleString('vi-VN')}\u0111</TableCell>
              <TableCell>{new Date(d.expectedDeliveryDate).toLocaleDateString('vi-VN')}</TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openDetail(d.id)} disabled={loadingDetail}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteModal({ id: d.id, ref: d.externalReference, type: 'shipment' })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-600" />
            Qu\u1ea3n l\u00fd Giao h\u00e0ng
          </h2>
          <p className="text-sm text-slate-500 mt-1">Xem & qu\u1ea3n l\u00fd lu\u1ed3ng giao h\u00e0ng NCC \u2192 Kho</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { loadPending(); loadAll(); }}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          L\u00e0m m\u1edbi
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Truck className="w-4 h-4" />
            \u0110ang giao
            {pendingTotal > 0 && (
              <Badge className="ml-1 bg-indigo-100 text-indigo-700 border-0 text-xs">{pendingTotal}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Package className="w-4 h-4" />
            T\u1ea5t c\u1ea3
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                  \u0110ang t\u1ea3i...
                </div>
              ) : (
                renderDeliveryTable(pendingDeliveries)
              )}
            </CardContent>
          </Card>
          {pendingTotal > PAGE_SIZE && (
            <div className="flex justify-center gap-2 mt-4">
              <Button size="sm" variant="outline" disabled={pendingPage <= 1} onClick={() => setPendingPage(p => p - 1)}>Tr\u01b0\u1edbc</Button>
              <span className="px-3 py-1 text-sm text-slate-600">Trang {pendingPage} / {Math.ceil(pendingTotal / PAGE_SIZE)}</span>
              <Button size="sm" variant="outline" disabled={pendingPage >= Math.ceil(pendingTotal / PAGE_SIZE)} onClick={() => setPendingPage(p => p + 1)}>Sau</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="T\u00ecm theo m\u00e3 l\u00f4, NCC..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setAllPage(1); }}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setAllPage(1); }}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">T\u1ea5t c\u1ea3 tr\u1ea1ng th\u00e1i</option>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                  \u0110ang t\u1ea3i...
                </div>
              ) : (
                renderDeliveryTable(allDeliveries)
              )}
            </CardContent>
          </Card>
          {allTotal > PAGE_SIZE && (
            <div className="flex justify-center gap-2 mt-4">
              <Button size="sm" variant="outline" disabled={allPage <= 1} onClick={() => setAllPage(p => p - 1)}>Tr\u01b0\u1edbc</Button>
              <span className="px-3 py-1 text-sm text-slate-600">Trang {allPage} / {Math.ceil(allTotal / PAGE_SIZE)}</span>
              <Button size="sm" variant="outline" disabled={allPage >= Math.ceil(allTotal / PAGE_SIZE)} onClick={() => setAllPage(p => p + 1)}>Sau</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              Chi ti\u1ebft giao h\u00e0ng: {detailModal?.externalReference}
            </DialogTitle>
          </DialogHeader>
          {detailModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Tr\u1ea1ng th\u00e1i</p>
                  {getStatusBadge(detailModal.status)}
                </div>
                <div>
                  <p className="text-xs text-slate-500">NCC</p>
                  <p className="font-medium">{detailModal.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kho</p>
                  <p className="font-medium">{detailModal.warehouseName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Gi\u00e1 tr\u1ecb</p>
                  <p className="font-medium">{(detailModal.totalValue || 0).toLocaleString('vi-VN')}\u0111</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ng\u00e0y giao d\u1ef1 ki\u1ebfn</p>
                  <p className="font-medium">{new Date(detailModal.expectedDeliveryDate).toLocaleDateString('vi-VN')}</p>
                </div>
                {detailModal.trackingNumber && (
                  <div>
                    <p className="text-xs text-slate-500">M\u00e3 v\u1eadn \u0111\u01a1n</p>
                    <p className="font-medium">{detailModal.trackingNumber}</p>
                  </div>
                )}
                {detailModal.carrier && (
                  <div>
                    <p className="text-xs text-slate-500">\u0110\u01a1n v\u1ecb v\u1eadn chuy\u1ec3n</p>
                    <p className="font-medium">{detailModal.carrier}</p>
                  </div>
                )}
                {detailModal.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Ghi ch\u00fa</p>
                    <p className="text-sm">{detailModal.notes}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              {detailModal.items?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">S\u1ea3n ph\u1ea9m ({detailModal.items.length})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S\u1ea3n ph\u1ea9m</TableHead>
                        <TableHead className="text-right">SL d\u1ef1 ki\u1ebfn</TableHead>
                        <TableHead className="text-right">SL nh\u1eadn</TableHead>
                        <TableHead className="text-right">\u0110\u01a1n gi\u00e1</TableHead>
                        <TableHead className="text-right">Th\u00e0nh ti\u1ec1n</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailModal.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{item.productName}</p>
                              {item.productSku && <p className="text-xs text-slate-400">{item.productSku}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.expectedQuantity}</TableCell>
                          <TableCell className="text-right">{item.receivedQuantity ?? '-'}</TableCell>
                          <TableCell className="text-right">{item.unitCost.toLocaleString('vi-VN')}\u0111</TableCell>
                          <TableCell className="text-right font-medium">{item.lineTotal.toLocaleString('vi-VN')}\u0111</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Status History */}
              {detailModal.statusHistory?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">L\u1ecbch s\u1eed tr\u1ea1ng th\u00e1i</h4>
                  <div className="space-y-2">
                    {detailModal.statusHistory.map((h) => (
                      <div key={h.id} className="flex items-start gap-2 text-sm border-l-2 border-slate-200 pl-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {h.previousStatus && (
                              <>
                                {getStatusBadge(h.previousStatus)}
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                              </>
                            )}
                            {getStatusBadge(h.newStatus)}
                          </div>
                          {h.notes && <p className="text-slate-500 text-xs mt-1">{h.notes}</p>}
                          {h.changedByName && <p className="text-slate-400 text-xs">b\u1edfi {h.changedByName}</p>}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(h.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Button */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteModal({ id: detailModal.id, ref: detailModal.externalReference, type: 'shipment' })}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> X\u00f3a l\u00f4 h\u00e0ng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>X\u00e1c nh\u1eadn x\u00f3a</DialogTitle>
            <DialogDescription>
              B\u1ea1n c\u00f3 ch\u1eafc mu\u1ed1n x\u00f3a {deleteModal?.type === 'shipment' ? 'l\u00f4 h\u00e0ng' : 'phi\u00ean nh\u1eadp'} <strong>{deleteModal?.ref}</strong>? 
              Thao t\u00e1c n\u00e0y kh\u00f4ng th\u1ec3 ho\u00e0n t\u00e1c.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)} disabled={processing}>H\u1ee7y</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              X\u00f3a
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
