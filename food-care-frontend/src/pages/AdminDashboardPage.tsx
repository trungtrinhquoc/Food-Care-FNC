import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  MessageSquare,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import { products as initialProducts } from "../data/products";

// Hooks
import { useProducts } from "../hooks/useProducts";
import { useOrders } from "../hooks/useOrders";
import { useSuppliers } from "../hooks/useSuppliers";
import { useZaloReminders } from "../hooks/useZaloReminders";

// Services & Data
import { mockOrders, mockSuppliers, mockCustomers, mockZaloReminders } from "../services/adminService";
import { MOCK_STATS, MOCK_REVENUE_DATA } from "../constants/admin";

// Dialog Components
import { ProductDialog } from "../components/admin/ProductDialog";
import { SupplierDialog } from "../components/admin/SupplierDialog";
import { OrderDetailDialog } from "../components/admin/OrderDetailDialog";

// Tab Components
import { OverviewTab } from "./admin/OverviewTab";
import { ProductsTab } from "./admin/ProductsTab";
import { OrdersTab } from "./admin/OrdersTab";
import { CustomersTab } from "./admin/CustomersTab";
import { SuppliersTab } from "./admin/SuppliersTab";
import { ZaloTab } from "./admin/ZaloTab";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Custom hooks for state management
  const productsHook = useProducts(initialProducts);
  const ordersHook = useOrders(mockOrders);
  const suppliersHook = useSuppliers(mockSuppliers);
  const zaloHook = useZaloReminders(mockZaloReminders);

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    toast.error("Bạn không có quyền truy cập trang này");
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Quản lý và thống kê hệ thống Food & Care</p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="products">
              <Box className="w-4 h-4 mr-2" />
              Sản phẩm
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Đơn hàng
            </TabsTrigger>
            <TabsTrigger value="customers">
              <Users className="w-4 h-4 mr-2" />
              Khách hàng
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Package className="w-4 h-4 mr-2" />
              NCC
            </TabsTrigger>
            <TabsTrigger value="zalo">
              <MessageSquare className="w-4 h-4 mr-2" />
              Zalo
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <OverviewTab
              stats={MOCK_STATS}
              revenueData={MOCK_REVENUE_DATA}
              totalProducts={productsHook.products.length}
            />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductsTab
              products={productsHook.products}
              onAdd={() => productsHook.openProductDialog()}
              onEdit={productsHook.openProductDialog}
              onDelete={productsHook.deleteProduct}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <OrdersTab
              orders={ordersHook.orders}
              onViewDetail={ordersHook.viewOrderDetail}
              onUpdateStatus={ordersHook.updateOrderStatus}
            />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <CustomersTab customers={mockCustomers} />
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers">
            <SuppliersTab
              suppliers={suppliersHook.suppliers}
              onAdd={() => suppliersHook.openSupplierDialog()}
              onEdit={suppliersHook.openSupplierDialog}
              onDelete={suppliersHook.deleteSupplier}
            />
          </TabsContent>

          {/* Zalo Tab */}
          <TabsContent value="zalo">
            <ZaloTab
              reminders={mockZaloReminders}
              onSendReminder={zaloHook.sendReminder}
              onSendBulk={zaloHook.sendBulkReminders}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ProductDialog
        open={productsHook.isProductDialogOpen}
        onOpenChange={productsHook.closeProductDialog}
        editingProduct={productsHook.editingProduct}
        productForm={productsHook.productForm}
        onUpdateForm={productsHook.updateProductForm}
        onSave={productsHook.saveProduct}
      />

      <SupplierDialog
        open={suppliersHook.isSupplierDialogOpen}
        onOpenChange={suppliersHook.closeSupplierDialog}
        editingSupplier={suppliersHook.editingSupplier}
        supplierForm={suppliersHook.supplierForm}
        onUpdateForm={suppliersHook.updateSupplierForm}
        onSave={suppliersHook.saveSupplier}
      />

      <OrderDetailDialog
        open={ordersHook.isOrderDialogOpen}
        onOpenChange={ordersHook.closeOrderDialog}
        order={ordersHook.selectedOrder}
      />
    </div>
  );
}
