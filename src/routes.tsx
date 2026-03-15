import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './lib/auth-context';
import { BrandingProvider } from './lib/branding-context';
import { EmployeeChat } from './components/EmployeeChat';
import { Toaster } from './components/ui/sonner';

// Lazy load heavy components for better initial load performance
const CompanySignup = lazy(() => import('./pages/CompanySignup'));
const EmployeePortal = lazy(() => import('./pages/EmployeePortal'));
const PaystackSubscription = lazy(() => import('./pages/PaystackSubscription'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ManagerDashboard = lazy(() => import('./components/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const EmployeeDashboard = lazy(() => import('./components/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const PaymentVerification = lazy(() => import('./components/PaymentVerification').then(m => ({ default: m.PaymentVerification })));
const LicensePaymentVerification = lazy(() => import('./components/LicensePaymentVerification').then(m => ({ default: m.LicensePaymentVerification })));
import LandingPage from './pages/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

// Root layout that provides context to all routes
function RootLayout() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <EmployeeChat />
        <Outlet />
      </AuthProvider>
    </BrandingProvider>
  );
}

// Create component wrappers instead of JSX elements
const CompanySignupPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <CompanySignup />
  </Suspense>
);

const EmployeePortalPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <EmployeePortal />
  </Suspense>
);

const SubscriptionPage = () => (
  <ProtectedRoute allowedRoles={['superadmin']}>
    <Suspense fallback={<LoadingFallback />}>
      <PaystackSubscription />
    </Suspense>
  </ProtectedRoute>
);

const PaymentVerifyPage = () => (
  <ProtectedRoute allowedRoles={['superadmin']}>
    <Suspense fallback={<LoadingFallback />}>
      <PaymentVerification />
    </Suspense>
  </ProtectedRoute>
);

const LicensePaymentVerifyPage = () => (
  <ProtectedRoute allowedRoles={['superadmin']}>
    <Suspense fallback={<LoadingFallback />}>
      <LicensePaymentVerification />
    </Suspense>
  </ProtectedRoute>
);

const SuperAdminPage = () => (
  <ProtectedRoute allowedRoles={['superadmin']}>
    <Suspense fallback={<LoadingFallback />}>
      <SuperAdminDashboard />
    </Suspense>
  </ProtectedRoute>
);

const AdminPage = () => (
  <ProtectedRoute allowedRoles={['admin']}>
    <Suspense fallback={<LoadingFallback />}>
      <AdminDashboard />
    </Suspense>
  </ProtectedRoute>
);

const ManagerPage = () => (
  <ProtectedRoute allowedRoles={['manager']}>
    <Suspense fallback={<LoadingFallback />}>
      <ManagerDashboard />
    </Suspense>
  </ProtectedRoute>
);

const EmployeePage = () => (
  <ProtectedRoute allowedRoles={['employee']}>
    <Suspense fallback={<LoadingFallback />}>
      <EmployeeDashboard />
    </Suspense>
  </ProtectedRoute>
);

const NotFoundPage = () => <Navigate to="/login" replace />;

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: '/',
        Component: LandingPage,
      },
      {
        path: '/login',
        Component: LoginPage,
      },
      {
        path: '/company-signup',
        Component: CompanySignupPage,
      },
      {
        path: '/subscription',
        Component: SubscriptionPage,
      },
      {
        path: '/payment-verify',
        Component: PaymentVerifyPage,
      },
      {
        path: '/payment-verify-license',
        Component: LicensePaymentVerifyPage,
      },
      {
        path: '/superadmin',
        Component: SuperAdminPage,
      },
      {
        path: '/admin',
        Component: AdminPage,
      },
      {
        path: '/manager',
        Component: ManagerPage,
      },
      {
        path: '/employee',
        Component: EmployeePage,
      },
      {
        path: '/employee-portal',
        Component: EmployeePortalPage,
      },
      {
        path: '*',
        Component: NotFoundPage,
      },
    ],
  },
]);