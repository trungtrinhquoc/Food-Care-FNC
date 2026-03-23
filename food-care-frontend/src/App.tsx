import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from 'sonner';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductVariantsPage from './pages/ProductVariantsPage';
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
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import NotificationsPage from './pages/NotificationsPage';
import BlindBoxPage from './pages/BlindBoxPage';
import MartSelectionPage from './pages/MartSelectionPage';
import CrossMartSearchPage from './pages/CrossMartSearchPage';
import MartStorePage from './pages/MartStorePage';
import ServerCartPage from './pages/ServerCartPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import FeedbackPage from './pages/FeedbackPage';
import { profileApi } from './services/api';
import { martApi } from './services/martApi';

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

// Guard: redirect brand-new customer users to onboarding
const NewUserGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      if (loading) return;

      if (!isAuthenticated || user?.role?.toLowerCase() !== 'customer') {
        if (!cancelled) setCheckingOnboarding(false);
        return;
      }

      try {
        const [addresses, selectedMartId] = await Promise.all([
          profileApi.getAddresses(),
          martApi.getSelectedMart(),
        ]);

        const hasDefaultAddress = addresses.some((a) => a.isDefault);
        const hasSelectedMart = !!selectedMartId;

        if (!hasDefaultAddress || !hasSelectedMart) {
          localStorage.setItem('onboarding_pending', 'true');
          navigate('/welcome', { replace: true });
          return;
        }

        localStorage.setItem('onboarding_completed', 'true');
      } catch {
        localStorage.setItem('onboarding_pending', 'true');
        navigate('/welcome', { replace: true });
        return;
      }

      if (!cancelled) setCheckingOnboarding(false);
    };

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading, navigate, user?.role]);

  if (loading || checkingOnboarding) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSupplierRoute = location.pathname.startsWith('/supplier');
  const isDashboardRoute = isAdminRoute || isSupplierRoute;
  const isFullscreenRoute = ['/welcome', '/onboarding'].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {!isDashboardRoute && !isFullscreenRoute && <Header />}
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<NewUserGuard><HomePage /></NewUserGuard>} />
          <Route path="/welcome" element={<SplashPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/onboarding/mart" element={<ProtectedRoute><MartSelectionPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/variants" element={<ProductVariantsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/checkout" element={
            <ProtectedRoute><CheckoutPage /></ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute><CartPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/subscriptions" element={
            <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>
          } />
          <Route path="/vouchers" element={
            <ProtectedRoute><VoucherCenterPage /></ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute><NotificationsPage /></ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute><FeedbackPage /></ProtectedRoute>
          } />
          <Route path="/blind-boxes" element={<BlindBoxPage />} />
          <Route path="/mart-selection" element={<MartSelectionPage />} />
          <Route path="/marts/:id" element={<MartStorePage />} />
          <Route path="/search-all" element={<CrossMartSearchPage />} />
          <Route path="/server-cart" element={
            <ProtectedRoute><ServerCartPage /></ProtectedRoute>
          } />
          <Route path="/orders/:id/tracking" element={
            <ProtectedRoute><OrderTrackingPage /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute><AdminDashboardPage /></AdminRoute>
          } />
          <Route path="/supplier" element={
            <SupplierRoute><SupplierDashboardPage /></SupplierRoute>
          } />
          <Route path="/supplier/shipments" element={
            <SupplierRoute><SupplierShipmentManagement /></SupplierRoute>
          } />

          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />

          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isDashboardRoute && !isFullscreenRoute && <Footer />}
      {/* Chat Widget - only show when logged in and not on dashboard/fullscreen routes */}
      {!isDashboardRoute && !isFullscreenRoute && <ChatWidgetWrapper />}
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
