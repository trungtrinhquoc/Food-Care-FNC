import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Search, Download, Eye, MessageSquare } from "lucide-react";
import { TierBadge } from "../../components/admin/BadgeComponents";
import type { AdminCustomer } from "../../types/admin";

interface CustomersTabProps {
  customers: AdminCustomer[];
}

export function CustomersTab({ customers }: CustomersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Quản lý khách hàng</CardTitle>
            <CardDescription>Tổng {customers.length} khách hàng</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Xuất danh sách
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã KH</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Hạng</TableHead>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Chi tiêu</TableHead>
              <TableHead>Định kỳ</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-mono text-sm">{customer.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.joinDate}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{customer.email}</div>
                    <div className="text-gray-500">{customer.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <TierBadge tier={customer.memberTier} />
                </TableCell>
                <TableCell className="font-medium">{customer.totalOrders}</TableCell>
                <TableCell className="font-medium">
                  {(customer.totalSpent / 1000000).toFixed(1)}M
                </TableCell>
                <TableCell>{customer.subscriptions} gói</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-4 h-4" />
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
