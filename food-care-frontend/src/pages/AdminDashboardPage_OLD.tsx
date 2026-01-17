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

// Components
import { StatsCard } from "../components/admin/StatsCard";
import { RevenueChart } from "../components/admin/RevenueChart";
import { ProductDialog } from "../components/admin/ProductDialog";
import { SupplierDialog } from "../components/admin/SupplierDialog";
import { OrderDetailDialog } from "../components/admin/OrderDetailDialog";

// Lazy load tab components for better performance
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

const mockOrders = [
  {
    id: "ORD-001",
    customerName: "Nguyễn Văn A",
    date: "2025-01-20",
    total: 450000,
    status: "delivered",
    items: 3,
    subscription: true,
    products: ["Gạo ST25", "Dầu ăn", "Cà phê"],
    address: "123 Nguyễn Huệ, Q1, TP.HCM",
    phone: "0901234567",
  },
  {
    id: "ORD-002",
    customerName: "Trần Thị B",
    date: "2025-01-20",
    total: 680000,
    status: "shipping",
    items: 5,
    subscription: false,
    products: [
      "Giấy vệ sinh",
      "Nước giặt",
      "Mì Ý",
      "Ngũ cốc",
      "Sữa",
    ],
    address: "456 Lê Lợi, Q3, TP.HCM",
    phone: "0912345678",
  },
  {
    id: "ORD-003",
    customerName: "Lê Văn C",
    date: "2025-01-19",
    total: 320000,
    status: "processing",
    items: 2,
    subscription: true,
    products: ["Cà phê", "Ngũ cốc"],
    address: "789 Trần Hưng Đạo, Q5, TP.HCM",
    phone: "0923456789",
  },
  {
    id: "ORD-004",
    customerName: "Phạm Thị D",
    date: "2025-01-19",
    total: 890000,
    status: "pending",
    items: 7,
    subscription: false,
    products: [
      "Gạo ST25",
      "Dầu ăn",
      "Giấy vệ sinh",
      "Nước giặt",
      "Cà phê",
      "Mì Ý",
      "Sữa",
    ],
    address: "321 Võ Văn Tần, Q3, TP.HCM",
    phone: "0934567890",
  },
];

const mockCustomers = [
  {
    id: "USR-001",
    name: "Nguyễn Văn A",
    email: "nguyenvana@email.com",
    phone: "0901234567",
    memberTier: "Gold",
    totalOrders: 42,
    totalSpent: 8500000,
    joinDate: "2024-01-15",
    subscriptions: 3,
  },
  {
    id: "USR-002",
    name: "Trần Thị B",
    email: "tranthib@email.com",
    phone: "0912345678",
    memberTier: "Silver",
    totalOrders: 28,
    totalSpent: 5200000,
    joinDate: "2024-03-20",
    subscriptions: 2,
  },
  {
    id: "USR-003",
    name: "Lê Văn C",
    email: "levanc@email.com",
    phone: "0923456789",
    memberTier: "Platinum",
    totalOrders: 65,
    totalSpent: 15000000,
    joinDate: "2023-11-10",
    subscriptions: 5,
  },
];

const mockSuppliers = [
  {
    id: "SUP-001",
    name: "Công ty Lương Thực Miền Nam",
    products: ["Gạo ST25", "Gạo Jasmine", "Ngũ cốc"],
    totalProducts: 12,
    status: "active",
    phone: "0281234567",
    email: "contact@luongthucmn.vn",
    address: "KCN Tân Bình, TP.HCM",
    contact: "Nguyễn Văn A",
  },
  {
    id: "SUP-002",
    name: "Trung Nguyên Legend",
    products: ["Cà phê", "Trà"],
    totalProducts: 8,
    status: "active",
    phone: "0282345678",
    email: "supplier@trungnguyenlegend.com",
    address: "123 Đường Cách Mạng, Q3, TP.HCM",
    contact: "Trần Thị B",
  },
  {
    id: "SUP-003",
    name: "Unilever Việt Nam",
    products: ["Bột giặt", "Nước rửa chén", "Giấy vệ sinh"],
    totalProducts: 15,
    status: "active",
    phone: "0283456789",
    email: "partner@unilever.com.vn",
    address: "KCN Vĩnh Lộc, Bình Chánh, TP.HCM",
    contact: "Lê Văn C",
  },
];

const mockZaloReminders = [
  {
    id: "REM-001",
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    product: "Gạo ST25 5kg",
    estimatedDaysLeft: 5,
    lastPurchase: "2024-12-26",
    status: "pending",
  },
  {
    id: "REM-002",
    customerName: "Trần Thị B",
    phone: "0912345678",
    product: "Cà phê Trung Nguyên",
    estimatedDaysLeft: 3,
    lastPurchase: "2025-01-08",
    status: "sent",
    sentDate: "2025-01-20",
  },
  {
    id: "REM-003",
    customerName: "Lê Văn C",
    phone: "0923456789",
    product: "Bột giặt OMO",
    estimatedDaysLeft: 2,
    lastPurchase: "2024-12-23",
    status: "pending",
  },
];

export function AdminDashboardPage({
  onNavigate,
}: AdminDashboardPageProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [products, setProducts] = useState(initialProducts);
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [orders, setOrders] = useState(mockOrders);

  // Product dialog state
  const [isProductDialogOpen, setIsProductDialogOpen] =
    useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    originalPrice: "",
    image: "",
    description: "",
    unit: "",
    stock: "",
  });

  // Supplier dialog state
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] =
    useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState<any>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contact: "",
    products: "",
  });

  // Order detail dialog state
  const [isOrderDialogOpen, setIsOrderDialogOpen] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    toast.error("Bạn không có quyền truy cập trang này");
    onNavigate("home");
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string }
    > = {
      delivered: {
        label: "Đã giao",
        className: "bg-green-500",
      },
      shipping: {
        label: "Đang giao",
        className: "bg-blue-500",
      },
      processing: {
        label: "Đang xử lý",
        className: "bg-yellow-500",
      },
      pending: { label: "Chờ xử lý", className: "bg-gray-500" },
      cancelled: { label: "Đã hủy", className: "bg-red-500" },
      sent: { label: "Đã gửi", className: "bg-green-500" },
      active: { label: "Hoạt động", className: "bg-green-500" },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-500",
    };
    return (
      <Badge className={config.className}>{config.label}</Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierConfig: Record<string, string> = {
      Bronze: "bg-orange-600",
      Silver: "bg-gray-400",
      Gold: "bg-yellow-500",
      Platinum: "bg-purple-600",
    };
    return <Badge className={tierConfig[tier]}>{tier}</Badge>;
  };

  const handleSendZaloReminder = (reminderId: string) => {
    toast.success("Đã gửi nhắc nhở qua Zalo thành công!");
  };

  // Product handlers
  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || "",
        image: product.image,
        description: product.description,
        unit: product.unit,
        stock: product.stock.toString(),
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        category: "",
        price: "",
        originalPrice: "",
        image: "",
        description: "",
        unit: "",
        stock: "",
      });
    }
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (
      !productForm.name ||
      !productForm.category ||
      !productForm.price ||
      !productForm.unit ||
      !productForm.stock
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    const newProduct: Product = {
      id: editingProduct
        ? editingProduct.id
        : `${products.length + 1}`,
      name: productForm.name,
      category: productForm.category,
      price: parseFloat(productForm.price),
      originalPrice: productForm.originalPrice
        ? parseFloat(productForm.originalPrice)
        : undefined,
      image:
        productForm.image ||
        "https://images.unsplash.com/photo-1686820740687-426a7b9b2043?w=400",
      description: productForm.description,
      unit: productForm.unit,
      stock: parseInt(productForm.stock),
      rating: editingProduct?.rating || 4.5,
      reviews: editingProduct?.reviews || 0,
      reviewList: editingProduct?.reviewList || [],
    };

    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? newProduct : p,
        ),
      );
      toast.success("Cập nhật sản phẩm thành công!");
    } else {
      setProducts([...products, newProduct]);
      toast.success("Thêm sản phẩm mới thành công!");
    }

    setIsProductDialogOpen(false);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
    toast.success("Đã xóa sản phẩm");
  };

  // Supplier handlers
  const handleOpenSupplierDialog = (supplier?: any) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        contact: supplier.contact,
        products: supplier.products.join(", "),
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        contact: "",
        products: "",
      });
    }
    setIsSupplierDialogOpen(true);
  };

  const handleSaveSupplier = () => {
    if (
      !supplierForm.name ||
      !supplierForm.email ||
      !supplierForm.phone
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    const newSupplier = {
      id: editingSupplier
        ? editingSupplier.id
        : `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
      name: supplierForm.name,
      email: supplierForm.email,
      phone: supplierForm.phone,
      address: supplierForm.address,
      contact: supplierForm.contact,
      products: supplierForm.products
        .split(",")
        .map((p) => p.trim()),
      totalProducts: supplierForm.products.split(",").length,
      status: "active",
    };

    if (editingSupplier) {
      setSuppliers(
        suppliers.map((s) =>
          s.id === editingSupplier.id ? newSupplier : s,
        ),
      );
      toast.success("Cập nhật nhà cung cấp thành công!");
    } else {
      setSuppliers([...suppliers, newSupplier]);
      toast.success("Thêm nhà cung cấp mới thành công!");
    }

    setIsSupplierDialogOpen(false);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers(suppliers.filter((s) => s.id !== supplierId));
    toast.success("Đã xóa nhà cung cấp");
  };

  // Order handlers
  const handleViewOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: string,
  ) => {
    setOrders(
      orders.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o,
      ),
    );
    toast.success("Đã cập nhật trạng thái đơn hàng");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Quản lý và thống kê hệ thống Food & Care
          </p>
        </div>

        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-6"
        >
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
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    Doanh thu
                  </CardTitle>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">
                    {mockStats.totalRevenue.toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </div>
                  <p className="text-xs text-emerald-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />+
                    {mockStats.monthlyGrowth}% so với tháng
                    trước
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    Đơn hàng
                  </CardTitle>
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">
                    {mockStats.totalOrders}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {mockStats.activeSubscriptions} đơn định kỳ
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    Khách hàng
                  </CardTitle>
                  <Users className="w-4 h-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">
                    {mockStats.totalCustomers}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tổng người dùng đã đăng ký
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">
                    Sản phẩm
                  </CardTitle>
                  <Package className="w-4 h-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">
                    {products.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Đang kinh doanh
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Doanh thu 6 tháng gần nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { month: "Tháng 8", revenue: 18000000 },
                    { month: "Tháng 9", revenue: 21000000 },
                    { month: "Tháng 10", revenue: 19500000 },
                    { month: "Tháng 11", revenue: 23000000 },
                    { month: "Tháng 12", revenue: 25000000 },
                    { month: "Tháng 1", revenue: 28000000 },
                  ].map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center gap-4"
                    >
                      <div className="w-24 text-sm text-gray-600">
                        {item.month}
                      </div>
                      <div className="flex-1">
                        <div className="h-8 bg-emerald-100 rounded-lg relative overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 flex items-center justify-end pr-2"
                            style={{
                              width: `${(item.revenue / 30000000) * 100}%`,
                            }}
                          >
                            <span className="text-xs text-white">
                              {item.revenue.toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Hành động nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất báo cáo
                  </Button>
                  <Button variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    Gửi thông báo
                  </Button>
                  <Button variant="outline">
                    <Bell className="w-4 h-4 mr-2" />
                    Cài đặt nhắc nhở
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quản lý sản phẩm</CardTitle>
                    <CardDescription>
                      Tổng {products.length} sản phẩm
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleOpenProductDialog()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm sản phẩm
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchTerm}
                      onChange={(e) =>
                        setSearchTerm(e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Tồn kho</TableHead>
                      <TableHead>Đánh giá</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products
                      .filter(
                        (p) =>
                          p.name
                            .toLowerCase()
                            .includes(
                              searchTerm.toLowerCase(),
                            ) ||
                          p.category
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                      )
                      .map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <div>{product.name}</div>
                                <div className="text-xs text-gray-500">
                                  {product.id}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {product.category}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>
                                {product.price.toLocaleString(
                                  "vi-VN",
                                )}
                                đ
                              </div>
                              {product.originalPrice && (
                                <div className="text-xs text-gray-500 line-through">
                                  {product.originalPrice.toLocaleString(
                                    "vi-VN",
                                  )}
                                  đ
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                product.stock < 50
                                  ? "bg-red-500"
                                  : product.stock < 100
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }
                            >
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>⭐ {product.rating}</span>
                              <span className="text-xs text-gray-500">
                                ({product.reviews})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleOpenProductDialog(
                                    product,
                                  )
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteProduct(
                                    product.id,
                                  )
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quản lý đơn hàng</CardTitle>
                    <CardDescription>
                      Tổng {orders.length} đơn hàng
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Lọc
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Xuất
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm đơn hàng..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{order.customerName}</div>
                            {order.subscription && (
                              <Badge
                                variant="outline"
                                className="text-xs mt-1"
                              >
                                Định kỳ
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>
                          {order.items} sản phẩm
                        </TableCell>
                        <TableCell>
                          {order.total.toLocaleString("vi-VN")}đ
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleViewOrderDetail(order)
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  Chờ xử lý
                                </SelectItem>
                                <SelectItem value="processing">
                                  Đang xử lý
                                </SelectItem>
                                <SelectItem value="shipping">
                                  Đang giao
                                </SelectItem>
                                <SelectItem value="delivered">
                                  Đã giao
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Đã hủy
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quản lý khách hàng</CardTitle>
                    <CardDescription>
                      Tổng {mockCustomers.length} khách hàng
                    </CardDescription>
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
                    {mockCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono text-sm">
                          {customer.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{customer.name}</div>
                            <div className="text-xs text-gray-500">
                              {customer.joinDate}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.email}</div>
                            <div className="text-gray-500">
                              {customer.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTierBadge(customer.memberTier)}
                        </TableCell>
                        <TableCell>
                          {customer.totalOrders}
                        </TableCell>
                        <TableCell>
                          {(
                            customer.totalSpent / 1000000
                          ).toFixed(1)}
                          M
                        </TableCell>
                        <TableCell>
                          {customer.subscriptions} gói
                        </TableCell>
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
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quản lý nhà cung cấp</CardTitle>
                    <CardDescription>
                      Tổng {suppliers.length} nhà cung cấp
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleOpenSupplierDialog()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm nhà cung cấp
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers.map((supplier) => (
                    <Card key={supplier.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="mb-0">
                                {supplier.name}
                              </h3>
                              {getStatusBadge(supplier.status)}
                            </div>
                            <div className="text-sm text-gray-600 mb-3 space-y-1">
                              <div>📧 {supplier.email}</div>
                              <div>📱 {supplier.phone}</div>
                              <div>📍 {supplier.address}</div>
                              <div>
                                👤 Người liên hệ:{" "}
                                {supplier.contact}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {supplier.products.map(
                                (product, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                  >
                                    {product}
                                  </Badge>
                                ),
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Tổng {supplier.totalProducts} sản
                              phẩm
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOpenSupplierDialog(
                                  supplier,
                                )
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteSupplier(
                                  supplier.id,
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zalo Reminders Tab */}
          <TabsContent value="zalo" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Hệ thống nhắc nhở Zalo
                    </CardTitle>
                    <CardDescription>
                      Tự động gửi nhắc nhở khi sản phẩm của
                      khách hàng sắp hết
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Bell className="w-4 h-4 mr-2" />
                      Cài đặt
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Gửi hàng loạt
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Card className="mb-6 bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="text-sm mb-1 text-blue-900">
                          Cách hoạt động
                        </h3>
                        <p className="text-xs text-blue-700">
                          Hệ thống tự động phát hiện khách hàng
                          có sản phẩm sắp hết dựa trên lịch sử
                          mua hàng và thời gian sử dụng trung
                          bình. Bạn có thể gửi tin nhắn nhắc nhở
                          qua Zalo để khuyến khích họ đặt hàng
                          lại hoặc đăng ký gói định kỳ.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Mua lần cuối</TableHead>
                      <TableHead>Ước tính còn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockZaloReminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell>
                          <div>
                            <div>{reminder.customerName}</div>
                            <div className="text-xs text-gray-500">
                              {reminder.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {reminder.product}
                        </TableCell>
                        <TableCell>
                          {reminder.lastPurchase}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              reminder.estimatedDaysLeft <= 3
                                ? "bg-red-500"
                                : reminder.estimatedDaysLeft <=
                                    7
                                  ? "bg-orange-500"
                                  : "bg-yellow-500"
                            }
                          >
                            ~{reminder.estimatedDaysLeft} ngày
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(reminder.status)}
                          {reminder.sentDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {reminder.sentDate}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {reminder.status === "pending" ? (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() =>
                                handleSendZaloReminder(
                                  reminder.id,
                                )
                              }
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Gửi ngay
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Xem
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Zalo Template Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Mẫu tin nhắn Zalo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tiêu đề tin nhắn</Label>
                  <Input placeholder="VD: Sản phẩm của bạn sắp hết!" />
                </div>
                <div>
                  <Label>Nội dung tin nhắn</Label>
                  <Textarea
                    placeholder="VD: Xin chào {customer_name}, sản phẩm {product_name} của bạn ước tính sẽ hết trong {days_left} ngày. Đặt hàng ngay để không bỏ lỡ!"
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="auto-send" />
                  <Label htmlFor="auto-send">
                    Tự động gửi khi sản phẩm còn 3 ngày
                  </Label>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Lưu cài đặt
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Dialog */}
      <Dialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct
                ? "Chỉnh sửa sản phẩm"
                : "Thêm sản phẩm mới"}
            </DialogTitle>
            <DialogDescription>
              Điền đầy đủ thông tin sản phẩm bên dưới
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên sản phẩm *</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    name: e.target.value,
                  })
                }
                placeholder="VD: Gạo ST25 Cao Cấp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Danh mục *</Label>
                <Input
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      category: e.target.value,
                    })
                  }
                  placeholder="VD: Thực phẩm khô"
                />
              </div>
              <div>
                <Label>Đơn vị *</Label>
                <Input
                  value={productForm.unit}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      unit: e.target.value,
                    })
                  }
                  placeholder="VD: 5kg"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Giá bán *</Label>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      price: e.target.value,
                    })
                  }
                  placeholder="185000"
                />
              </div>
              <div>
                <Label>Giá gốc</Label>
                <Input
                  type="number"
                  value={productForm.originalPrice}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      originalPrice: e.target.value,
                    })
                  }
                  placeholder="200000"
                />
              </div>
              <div>
                <Label>Tồn kho *</Label>
                <Input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      stock: e.target.value,
                    })
                  }
                  placeholder="150"
                />
              </div>
            </div>
            <div>
              <Label>URL hình ảnh</Label>
              <Input
                value={productForm.image}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    image: e.target.value,
                  })
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value,
                  })
                }
                placeholder="Mô tả chi tiết về sản phẩm..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProductDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSaveProduct}
            >
              {editingProduct ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier
                ? "Chỉnh sửa nhà cung cấp"
                : "Thêm nhà cung cấp mới"}
            </DialogTitle>
            <DialogDescription>
              Điền đầy đủ thông tin nhà cung cấp bên dưới
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên nhà cung cấp *</Label>
              <Input
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    name: e.target.value,
                  })
                }
                placeholder="VD: Công ty Lương Thực Miền Nam"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <Label>Số điện thoại *</Label>
                <Input
                  value={supplierForm.phone}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="0281234567"
                />
              </div>
            </div>
            <div>
              <Label>Địa chỉ</Label>
              <Input
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    address: e.target.value,
                  })
                }
                placeholder="KCN Tân Bình, TP.HCM"
              />
            </div>
            <div>
              <Label>Người liên hệ</Label>
              <Input
                value={supplierForm.contact}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    contact: e.target.value,
                  })
                }
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <Label>
                Sản phẩm cung cấp (phân cách bằng dấu phẩy)
              </Label>
              <Textarea
                value={supplierForm.products}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    products: e.target.value,
                  })
                }
                placeholder="Gạo ST25, Gạo Jasmine, Ngũ cốc"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSupplierDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSaveSupplier}
            >
              {editingSupplier ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn hàng {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">
                    Mã đơn hàng
                  </Label>
                  <p className="font-mono">
                    {selectedOrder.id}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">
                    Ngày đặt
                  </Label>
                  <p>{selectedOrder.date}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">
                  Khách hàng
                </Label>
                <p>{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-500">
                  {selectedOrder.phone}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">
                  Địa chỉ giao hàng
                </Label>
                <p>{selectedOrder.address}</p>
              </div>
              <div>
                <Label className="text-gray-500">
                  Sản phẩm
                </Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.products.map(
                    (product: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span>{product}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">
                    Trạng thái
                  </Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">
                    Tổng tiền
                  </Label>
                  <p className="text-xl text-emerald-600">
                    {selectedOrder.total.toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </p>
                </div>
              </div>
              {selectedOrder.subscription && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    🔄 Đơn hàng định kỳ - Tự động giao lại theo
                    chu kỳ đã đặt
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOrderDialogOpen(false)}
            >
              Đóng
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Truck className="w-4 h-4 mr-2" />
              Xử lý giao hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}