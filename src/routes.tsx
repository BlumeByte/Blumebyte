import { createBrowserRouter, Navigate } from 'react-router';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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

// Wrapper for lazy loaded components with Suspense
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/company-signup',
    element: withSuspense(CompanySignup),
  },
  {
    path: '/subscription',
    element: (
      <ProtectedRoute allowedRoles={['superadmin']}>
        {withSuspense(PaystackSubscription)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment-verify',
    element: (
      <ProtectedRoute allowedRoles={['superadmin']}>
        {withSuspense(PaymentVerification)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment-verify-license',
    element: (
      <ProtectedRoute allowedRoles={['superadmin']}>
        {withSuspense(LicensePaymentVerification)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/superadmin',
    element: (
      <ProtectedRoute allowedRoles={['superadmin']}>
        {withSuspense(SuperAdminDashboard)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        {withSuspense(AdminDashboard)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/manager',
    element: (
      <ProtectedRoute allowedRoles={['manager']}>
        {withSuspense(ManagerDashboard)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/employee',
    element: (
      <ProtectedRoute allowedRoles={['employee']}>
        {withSuspense(EmployeeDashboard)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/employee-portal',
    element: withSuspense(EmployeePortal),
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);