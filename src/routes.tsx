import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './lib/auth-context';
import { BrandingProvider } from './lib/branding-context';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';

// Import static pages directly (not lazy loaded)
import SecurityPolicy from './pages/SecurityPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';

// PERFORMANCE: Lazy load ALL heavy components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const CompanySignup = lazy(() => import('./pages/CompanySignup'));
const EmployeePortal = lazy(() => import('./pages/EmployeePortal'));
const PaystackSubscription = lazy(() => import('./pages/PaystackSubscription'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ManagerDashboard = lazy(() => import('./components/ManagerDashboard'));
const EmployeeDashboard = lazy(() => import('./components/EmployeeDashboard'));
const PaymentVerification = lazy(() => import('./components/PaymentVerification'));
const LicensePaymentVerification = lazy(() => import('./components/LicensePaymentVerification'));
const TwoFactorVerification = lazy(() => import('./pages/TwoFactorVerification'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const OAuthConsent = lazy(() => import('./pages/OAuthConsent'));
const PasswordReset = lazy(() => import('./pages/PasswordReset'));

// PERFORMANCE: Lazy load EmployeeChat to reduce initial bundle
const EmployeeChat = lazy(() => import('./components/EmployeeChat').then(m => ({ default: m.EmployeeChat })));

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
        {/* PERFORMANCE: Lazy load EmployeeChat in Suspense to reduce initial load */}
        <Suspense fallback={null}>
          <EmployeeChat />
        </Suspense>
        <Outlet />
      </AuthProvider>
    </BrandingProvider>
  );
}

// Create component wrappers instead of JSX elements
const LandingPageWrapper = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LandingPage />
  </Suspense>
);

const LoginPageWrapper = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LoginPage />
  </Suspense>
);

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

const SecurityPolicyPage = () => <SecurityPolicy />;

const PrivacyPolicyPage = () => <PrivacyPolicy />;

const TermsConditionsPage = () => <TermsConditions />;

const TwoFactorVerificationPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <TwoFactorVerification />
  </Suspense>
);

const AuthCallbackPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <AuthCallback />
  </Suspense>
);

const OAuthConsentPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <OAuthConsent />
  </Suspense>
);

const PasswordResetPage = () => (
  <Suspense fallback={<LoadingFallback />}>
    <PasswordReset />
  </Suspense>
);

const NotFoundPage = () => <Navigate to="/login" replace />;

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: '/',
        Component: LandingPageWrapper,
      },
      {
        path: '/login',
        Component: LoginPageWrapper,
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
        path: '/two-factor-verification',
        Component: TwoFactorVerificationPage,
      },
      {
        path: '/auth/callback',
        Component: AuthCallbackPage,
      },
      {
        path: '/auth-callback',
        Component: AuthCallbackPage,
      },
      {
        path: '/oauth-consent',
        Component: OAuthConsentPage,
      },
      {
        path: '/password-reset',
        Component: PasswordResetPage,
      },
      {
        path: '/security-policy',
        Component: SecurityPolicyPage,
      },
      {
        path: '/privacy-policy',
        Component: PrivacyPolicyPage,
      },
      {
        path: '/terms-conditions',
        Component: TermsConditionsPage,
      },
      {
        path: '*',
        Component: NotFoundPage,
      },
    ],
  },
]);
