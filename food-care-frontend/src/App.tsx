import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from 'sonner';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import VoucherCenterPage from './pages/VoucherCenterPage';
import SupplierDashboardPage from './pages/supplier/supplierDashboardPage';
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';

// Warehouse Receiving Components
import ReceivingDashboard from './components/staff/ReceivingDashboard';
import ReceiptInspectionPage from './components/staff/ReceiptInspectionPage';
import ShipmentDetailPage from './components/staff/ShipmentDetailPage';
import InventoryManagement from './components/staff/InventoryManagement';
import DiscrepancyManagement from './components/staff/DiscrepancyManagement';
import ReturnManagement from './components/staff/ReturnManagement';
import SupplierShipmentManagement from './components/supplier/SupplierShipmentManagement';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import SubscriptionsPage from './pages/SubscriptionsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Scroll to top on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Component - requires admin role
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Supplier Route Component - requires supplier role
const SupplierRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const isSupplier = user?.role?.toLowerCase() === 'supplier';

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSupplier) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Staff Route Component - requires staff or admin role
const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const isStaff = user?.role?.toLowerCase() === 'staff' || user?.role?.toLowerCase() === 'admin';

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          } />


          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute>
                <SubscriptionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vouchers"
            element={
              <ProtectedRoute>
                <VoucherCenterPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/supplier"
            element={
              <SupplierRoute>
                <SupplierDashboardPage />
              </SupplierRoute>
            }
          />
          {/* Supplier Shipment Routes */}
          <Route
            path="/supplier/shipments"
            element={
              <SupplierRoute>
                <SupplierShipmentManagement />
              </SupplierRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <StaffRoute>
                <StaffDashboardPage />
              </StaffRoute>
            }
          />
          {/* Staff Warehouse Routes */}
          <Route
            path="/staff/receiving"
            element={
              <StaffRoute>
                <ReceivingDashboard />
              </StaffRoute>
            }
          />
          <Route
            path="/staff/receipts/:receiptId"
            element={
              <StaffRoute>
                <ReceiptInspectionPage />
              </StaffRoute>
            }
          />
          <Route
            path="/staff/shipments/:shipmentId"
            element={
              <StaffRoute>
                <ShipmentDetailPage />
              </StaffRoute>
            }
          />
          <Route
            path="/staff/inventory"
            element={
              <StaffRoute>
                <InventoryManagement />
              </StaffRoute>
            }
          />
          <Route
            path="/staff/discrepancies"
            element={
              <StaffRoute>
                <DiscrepancyManagement />
              </StaffRoute>
            }
          />
          <Route
            path="/staff/returns"
            element={
              <StaffRoute>
                <ReturnManagement />
              </StaffRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />

          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </main>

      {!location.pathname.startsWith('/admin') && <Footer />}

      {/* Chat Widget - only show when logged in */}
      <ChatWidgetWrapper />
    </div>
  );
}

// Wrapper component for Chat Widget
function ChatWidgetWrapper() {
  return <ChatWidget />;
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
            <Toaster position="top-center" richColors />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
