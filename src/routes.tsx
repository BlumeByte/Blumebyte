import * as React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import SubscriptionPage from './components/SubscriptionPage';
import PaymentVerification from './components/PaymentVerification';
import LicensePaymentVerification from './components/LicensePaymentVerification';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/subscription',
    element: (
      <ProtectedRoute allowedRoles={['superadmin']}>
        <SubscriptionPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment-verify',
    element: (
      <ProtectedRoute allowedRoles={['superadmin']}>
        <PaymentVerification />
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment-verify-license',
    element: (
      <ProtectedRoute allowedRoles={['superadmin']}>
        <LicensePaymentVerification />
      </ProtectedRoute>
    ),
  },
  {
    path: '/superadmin',
    element: (
      <ProtectedRoute allowedRoles={['superadmin']}>
        <SuperAdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/manager',
    element: (
      <ProtectedRoute allowedRoles={['manager']}>
        <ManagerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/employee',
    element: (
      <ProtectedRoute allowedRoles={['employee']}>
        <EmployeeDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);