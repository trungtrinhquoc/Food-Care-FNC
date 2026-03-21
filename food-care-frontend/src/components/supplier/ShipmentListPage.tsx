import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  Plus, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { shipmentsApi, type SupplierShipment } from '../../services/supplier/supplierApi';

interface ShipmentListProps {
  supplierId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ShipmentListPage: React.FC<ShipmentListProps> = ({ supplierId: _supplierId }) => {
  const [shipments, setShipments] = useState<SupplierShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [stats, setStats] = useState({
    draft: 0,
    dispatched: 0,
    inTransit: 0,
    delivered: 0
  });

  useEffect(() => {
    loadShipments();
    loadStats();
  }, [filters]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const response = await shipmentsApi.getShipments(1, 100);
      setShipments(response.items || []);
    } catch (error) {
      console.error('Error loading shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await shipmentsApi.getShipments(1, 1000);
      const items = response.items || [];
      setStats({
        draft: items.filter(s => s.status === 'Draft').length,
        dispatched: items.filter(s => s.status === 'Dispatched').length,
        inTransit: items.filter(s => s.status === 'InTransit').length,
        delivered: items.filter(s => s.status === 'Stored' || s.status === 'Closed').length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
      Draft: { variant: 'secondary', icon: Clock },
      Dispatched: { variant: 'default', icon: Package },
      InTransit: { variant: 'default', icon: Truck },
      Arrived: { variant: 'outline', icon: AlertCircle },
      Inspected: { variant: 'outline', icon: AlertCircle },
      Stored: { variant: 'default', icon: CheckCircle },
      Closed: { variant: 'default', icon: CheckCircle },
      Cancelled: { variant: 'destructive', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.Draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dispatched</p>
                <p className="text-2xl font-bold">{stats.dispatched}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">{stats.inTransit}</p>
              </div>
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Shipments</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Dispatched">Dispatched</SelectItem>
                <SelectItem value="InTransit">In Transit</SelectItem>
                <SelectItem value="Arrived">Arrived</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : shipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No shipments found
                    </TableCell>
                  </TableRow>
                ) : (
                  shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">
                        {shipment.externalReference}
                      </TableCell>
                      <TableCell>{shipment.warehouseName}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        {shipment.totalItems} items ({shipment.totalQuantity} units)
                      </TableCell>
                      <TableCell>
                        {formatDate(shipment.expectedDeliveryDate)}
                      </TableCell>
                      <TableCell>
                        {shipment.trackingNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentListPage;
