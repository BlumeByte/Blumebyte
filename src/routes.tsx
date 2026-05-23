import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './lib/auth-context';
import { BrandingProvider } from './lib/branding-context';
import { CurrencyProvider } from './lib/currency-context';
import { DarkModeProvider } from './lib/dark-mode-context';
import { LanguageProvider } from './lib/language-context';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';

// Import static pages directly (not lazy loaded)
import LandingPage from './pages/LandingPage';
import LoginPage from './components/LoginPage';
import CompanySignup from './pages/CompanySignup';
import EmployeePortal from './pages/EmployeePortal';
import { SubscriptionPage as SubscriptionManagementPage } from './components/SubscriptionPage';
import AuthCallback from './pages/AuthCallback';
import OAuthConsent from './pages/OAuthConsent';
import PasswordReset from './pages/PasswordReset';
import SecurityPolicy from './pages/SecurityPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import PlatformOverview from './pages/PlatformOverview';
import PricingPage from './pages/PricingPage';
import IndustryPage from './pages/IndustryPage';
import ResourcesPage from './pages/ResourcesPage';
import FeaturesPage from './pages/FeaturesPage';
import IntegrationsPage from './pages/IntegrationsPage';
import HRDataReportingPage from './pages/HRDataReportingPage';
import TimeAttendancePage from './pages/TimeAttendancePage';
import PayrollPage from './pages/PayrollPage';
import PerformanceManagementPage from './pages/PerformanceManagementPage';
import CompensationPage from './pages/CompensationPage';
import ApplicantTrackingPage from './pages/ApplicantTrackingPage';
import OnboardingPage from './pages/OnboardingPage';
import EmployeeExperiencePage from './pages/EmployeeExperiencePage';
import HiringsPage from './pages/HiringsPage';
import HiringDetailPage from './pages/HiringDetailPage';
import DeveloperDashboard from './pages/UltimateadminSupport';
import CustomerCareDashboard from './pages/CareDashboard';
import { CUSTOMER_CARE_ROLES } from './lib/role-utils';

// Retry helper for lazy imports: on network failure, bust the cache and retry once.
function lazyWithRetry<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch(() =>
      factory().catch(err => {
        // If both attempts fail, reload the page to clear the stale module cache
        console.error('Failed to load module after retry, reloading page:', err);
        window.location.reload();
        return factory();
      })
    )
  );
}

// PERFORMANCE: Lazy load heavy dashboard components
const SuperAdminDashboard = lazyWithRetry(() => import('./components/SuperAdminDashboard'));
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard'));
const ManagerDashboard = lazyWithRetry(() => import('./components/ManagerDashboard'));
const EmployeeDashboard = lazyWithRetry(() => import('./components/EmployeeDashboard'));
const PaymentVerification = lazyWithRetry(() => import('./components/PaymentVerification'));
const LicensePaymentVerification = lazyWithRetry(() => import('./components/LicensePaymentVerification'));

// PERFORMANCE: Lazy load EmployeeChat to reduce initial bundle
const EmployeeChat = lazyWithRetry(() => import('./components/EmployeeChat').then(m => ({ default: m.EmployeeChat })));

// PERFORMANCE: Lazy load NotificationsPage
const NotificationsPage = lazyWithRetry(() => import('./components/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

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
        <CurrencyProvider>
          <LanguageProvider>
            <DarkModeProvider>
              <ScrollToTop />
              <Toaster richColors position="top-right" />
              {/* PERFORMANCE: Lazy load EmployeeChat in Suspense to reduce initial load */}
              <Suspense fallback={null}>
                <EmployeeChat />
              </Suspense>
              <Outlet />
            </DarkModeProvider>
          </LanguageProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrandingProvider>
  );
}

// Create component wrappers instead of JSX elements
const LoginPageWrapper = () => <LoginPage />;

const CompanySignupPage = () => <CompanySignup />;

const EmployeePortalPage = () => <EmployeePortal />;

const SubscriptionPage = () => (
  <ProtectedRoute allowedRoles={['superadmin']}>
    <SubscriptionManagementPage />
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


const AuthCallbackPage = () => <AuthCallback />;

const OAuthConsentPage = () => <OAuthConsent />;

const PasswordResetPage = () => <PasswordReset />;

const HRDataReportingPageWrapper = () => <HRDataReportingPage />;
const TimeAttendancePageWrapper = () => <TimeAttendancePage />;
const PayrollPageWrapper = () => <PayrollPage />;
const PerformanceManagementPageWrapper = () => <PerformanceManagementPage />;
const CompensationPageWrapper = () => <CompensationPage />;
const ApplicantTrackingPageWrapper = () => <ApplicantTrackingPage />;
const OnboardingPageWrapper = () => <OnboardingPage />;
const EmployeeExperiencePageWrapper = () => <EmployeeExperiencePage />;
const PlatformOverviewWrapper = () => <PlatformOverview />;
const PricingPageWrapper = () => <PricingPage />;
const FeaturesPageWrapper = () => <FeaturesPage />;
const IntegrationsPageWrapper = () => <IntegrationsPage />;
const IndustryPageWrapper = () => <IndustryPage />;
const ResourcesPageWrapper = () => <ResourcesPage />;
const HiringsPageWrapper = () => <HiringsPage />;
const HiringDetailPageWrapper = () => <HiringDetailPage />;
const DeveloperDashboardWrapper = () => <DeveloperDashboard />;
const CustomerCareDashboardWrapper = () => <CustomerCareDashboard />;

const DeveloperPage = () => (
  <ProtectedRoute allowedRoles={['developer', 'ultimateadmin']}>
    <DeveloperDashboardWrapper />
  </ProtectedRoute>
);

const CustomerCarePage = () => (
  <ProtectedRoute allowedRoles={[...CUSTOMER_CARE_ROLES, 'developer', 'ultimateadmin']}>
    <CustomerCareDashboardWrapper />
  </ProtectedRoute>
);

const NotificationsPageWrapper = () => (
  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'employee']}>
    <Suspense fallback={<LoadingFallback />}>
      <NotificationsPage />
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
        element: <LandingPage />,
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
        element: <Navigate to="/login" replace />,
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
        path: '/oauth/consent',
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
        path: '/pricing',
        Component: PricingPageWrapper,
      },
      {
        path: '/platform-overview',
        Component: PlatformOverviewWrapper,
      },
      {
        path: '/features',
        Component: FeaturesPageWrapper,
      },
      {
        path: '/integrations',
        Component: IntegrationsPageWrapper,
      },
      {
        path: '/industry/:industry',
        Component: IndustryPageWrapper,
      },
      {
        path: '/resources',
        Component: ResourcesPageWrapper,
      },
      {
        path: '/notifications',
        Component: NotificationsPageWrapper,
      },
      {
        path: '/hr-data-reporting',
        Component: HRDataReportingPageWrapper,
      },
      {
        path: '/time-attendance',
        Component: TimeAttendancePageWrapper,
      },
      {
        path: '/payroll',
        Component: PayrollPageWrapper,
      },
      {
        path: '/performance-management',
        Component: PerformanceManagementPageWrapper,
      },
      {
        path: '/compensation',
        Component: CompensationPageWrapper,
      },
      {
        path: '/applicant-tracking',
        Component: ApplicantTrackingPageWrapper,
      },
      {
        path: '/onboarding',
        Component: OnboardingPageWrapper,
      },
      {
        path: '/employee-experience',
        Component: EmployeeExperiencePageWrapper,
      },
      {
        path: '/hirings',
        Component: HiringsPageWrapper,
      },
      {
        path: '/hirings/:jobId',
        Component: HiringDetailPageWrapper,
      },
      {
        path: '/care-dashboard',
        element: <Navigate to="/support" replace />,
      },
      {
        path: '/care',
        element: <Navigate to="/support" replace />,
      },
      {
        path: '/ultimateadmin/support',
        element: <Navigate to="/developer" replace />,
      },
      {
        path: '/ultimateadmin',
        element: <Navigate to="/developer" replace />,
      },
      {
        path: '/developer',
        Component: DeveloperPage,
      },
      {
        path: '/customer_care',
        element: <Navigate to="/support" replace />,
      },
      {
        path: '/support',
        Component: CustomerCarePage,
      },
      {
        path: '/customer-care',
        element: <Navigate to="/support" replace />,
      },
      {
        path: '*',
        Component: NotFoundPage,
      },
    ],
  },
]);
