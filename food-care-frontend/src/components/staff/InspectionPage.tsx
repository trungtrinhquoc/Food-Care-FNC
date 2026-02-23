import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle,
  ClipboardCheck,
  Save,
  Send
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InspectionPageProps {
  receiptId: string;
}

interface InspectionItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  expectedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  damagedQuantity: number;
  missingQuantity: number;
  quarantineQuantity: number;
  batchNumber?: string;
  expiryDate?: string;
  qcRequired: boolean;
  qcPassed?: boolean;
  qcSampleSize?: number;
  qcPassedCount?: number;
  inspectionNotes?: string;
}

export const InspectionPage: React.FC<InspectionPageProps> = ({ receiptId }) => {
  const [receipt, setReceipt] = useState<{ receiptNumber?: string; shipmentReference?: string; warehouseName?: string; arrivalDate?: string; status?: string } | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [currentItem, setCurrentItem] = useState<InspectionItem | null>(null);
  const [showInspectDialog, setShowInspectDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inspectionStarted, setInspectionStarted] = useState(false);

  const loadReceipt = useCallback(async () => {
    try {
      setLoading(true);
      // API call - when backend is ready, uncomment:
      // const response = await receiptApi.getById(receiptId);
      // setReceipt(response);
      // setItems(response.items);
      // setInspectionStarted(response.status === 'Inspecting');
      
      // Mock data for now
      setReceipt({ receiptNumber: 'RCP-001', shipmentReference: 'SHIP-001', warehouseName: 'HCM Warehouse', arrivalDate: new Date().toISOString(), status: 'Pending' });
      setItems([]);
    } catch (error) {
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceipt();
  }, [receiptId, loadReceipt]);

  const handleStartInspection = async () => {
    try {
      // await receiptApi.startInspection(receiptId);
      setInspectionStarted(true);
      loadReceipt();
    } catch (error) {
      console.error('Error starting inspection:', error);
    }
  };

  const handleInspectItem = (item: InspectionItem) => {
    setCurrentItem({
      ...item,
      receivedQuantity: item.expectedQuantity,
      acceptedQuantity: item.expectedQuantity,
      damagedQuantity: 0,
      missingQuantity: 0,
      quarantineQuantity: 0
    });
    setShowInspectDialog(true);
  };

  const handleSaveInspection = async () => {
    if (!currentItem) return;

    try {
      // Validate quantities
      const total = 
        currentItem.acceptedQuantity + 
        currentItem.damagedQuantity + 
        currentItem.quarantineQuantity;

      if (total !== currentItem.receivedQuantity) {
        alert('Total quantities must equal received quantity');
        return;
      }

      // API call
      // await receiptApi.inspectItem(receiptId, currentItem.id, {
      //   receivedQuantity: currentItem.receivedQuantity,
      //   acceptedQuantity: currentItem.acceptedQuantity,
      //   damagedQuantity: currentItem.damagedQuantity,
      //   missingQuantity: currentItem.missingQuantity,
      //   quarantineQuantity: currentItem.quarantineQuantity,
      //   batchNumber: currentItem.batchNumber,
      //   expiryDate: currentItem.expiryDate,
      //   qcPassed: currentItem.qcPassed,
      //   qcSampleSize: currentItem.qcSampleSize,
      //   qcPassedCount: currentItem.qcPassedCount,
      //   inspectionNotes: currentItem.inspectionNotes
      // });

      setShowInspectDialog(false);
      loadReceipt();
    } catch (error) {
      console.error('Error saving inspection:', error);
    }
  };

  const handleCompleteInspection = async () => {
    if (!confirm('Complete inspection? This action cannot be undone.')) return;

    try {
      // Check if all items inspected
      const uninspected = items.filter(item => item.acceptedQuantity === 0);
      if (uninspected.length > 0) {
        alert(`Please inspect all items. ${uninspected.length} items remaining.`);
        return;
      }

      // API call
      // await receiptApi.completeInspection(receiptId, {
      //   inspectionNotes: 'Inspection completed'
      // });

      // Redirect or refresh
    } catch (error) {
      console.error('Error completing inspection:', error);
    }
  };

  const getItemStatusBadge = (item: InspectionItem) => {
    if (item.acceptedQuantity > 0) {
      if (item.acceptedQuantity === item.expectedQuantity) {
        return <Badge className="bg-green-500 hover:bg-green-600">✓ Completed</Badge>;
      }
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Partial</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const updateItemQuantity = (field: keyof InspectionItem, value: number) => {
    if (!currentItem) return;

    setCurrentItem({
      ...currentItem,
      [field]: value
    });
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Receipt Inspection</CardTitle>
              <CardDescription>
                Receipt #{receipt?.receiptNumber} | Shipment: {receipt?.shipmentReference}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!inspectionStarted ? (
                <Button onClick={handleStartInspection}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Start Inspection
                </Button>
              ) : (
                <>
                  <Button variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </Button>
                  <Button onClick={handleCompleteInspection}>
                    <Send className="h-4 w-4 mr-2" />
                    Complete Inspection
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Warehouse</p>
              <p className="font-medium">{receipt?.warehouseName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Arrival Date</p>
              <p className="font-medium">
                {receipt?.arrivalDate ? new Date(receipt.arrivalDate).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="font-medium">{items.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{receipt?.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      {!inspectionStarted && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Click "Start Inspection" to begin the inspection process. You'll be able to inspect each item individually.
          </AlertDescription>
        </Alert>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items to Inspect</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Accepted</TableHead>
                <TableHead>Damaged</TableHead>
                <TableHead>Missing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.productSku}</TableCell>
                  <TableCell>{item.expectedQuantity}</TableCell>
                  <TableCell>{item.receivedQuantity}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {item.acceptedQuantity}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {item.damagedQuantity}
                  </TableCell>
                  <TableCell className="text-orange-600">
                    {item.missingQuantity}
                  </TableCell>
                  <TableCell>{getItemStatusBadge(item)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInspectItem(item)}
                      disabled={!inspectionStarted}
                    >
                      {item.acceptedQuantity > 0 ? 'Edit' : 'Inspect'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inspect Item Dialog */}
      <Dialog open={showInspectDialog} onOpenChange={setShowInspectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inspect Item: {currentItem?.productName}</DialogTitle>
          </DialogHeader>

          {currentItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expected Quantity</Label>
                  <Input
                    type="number"
                    value={currentItem.expectedQuantity}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Received Quantity *</Label>
                  <Input
                    type="number"
                    value={currentItem.receivedQuantity}
                    onChange={(e) => updateItemQuantity('receivedQuantity', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-green-600">Accepted *</Label>
                  <Input
                    type="number"
                    value={currentItem.acceptedQuantity}
                    onChange={(e) => updateItemQuantity('acceptedQuantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-red-600">Damaged</Label>
                  <Input
                    type="number"
                    value={currentItem.damagedQuantity}
                    onChange={(e) => updateItemQuantity('damagedQuantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-orange-600">Missing</Label>
                  <Input
                    type="number"
                    value={currentItem.missingQuantity}
                    onChange={(e) => updateItemQuantity('missingQuantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-yellow-600">Quarantine</Label>
                  <Input
                    type="number"
                    value={currentItem.quarantineQuantity}
                    onChange={(e) => updateItemQuantity('quarantineQuantity', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Total: {currentItem.acceptedQuantity + currentItem.damagedQuantity + currentItem.quarantineQuantity} 
                  {' '} (Must equal Received: {currentItem.receivedQuantity})
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Batch Number</Label>
                  <Input
                    value={currentItem.batchNumber || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, batchNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={currentItem.expiryDate || ''}
                    onChange={(e) => setCurrentItem({ ...currentItem, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              {currentItem.qcRequired && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quality Control</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Sample Size</Label>
                        <Input
                          type="number"
                          value={currentItem.qcSampleSize || ''}
                          onChange={(e) => updateItemQuantity('qcSampleSize', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Passed Count</Label>
                        <Input
                          type="number"
                          value={currentItem.qcPassedCount || ''}
                          onChange={(e) => updateItemQuantity('qcPassedCount', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>QC Result</Label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={currentItem.qcPassed?.toString() || ''}
                        onChange={(e) => setCurrentItem({ 
                          ...currentItem, 
                          qcPassed: e.target.value === 'true' 
                        })}
                      >
                        <option value="">Select result</option>
                        <option value="true">Pass</option>
                        <option value="false">Fail</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label>Inspection Notes</Label>
                <Textarea
                  value={currentItem.inspectionNotes || ''}
                  onChange={(e) => setCurrentItem({ ...currentItem, inspectionNotes: e.target.value })}
                  rows={3}
                  placeholder="Any observations or issues..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInspectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveInspection}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InspectionPage;
