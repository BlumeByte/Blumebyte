import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { Loader2 } from 'lucide-react';
import { ForcePasswordChange } from './ForcePasswordChange';
// Subscription enforcement temporarily deactivated
// import { SubscriptionEnforcement } from './SubscriptionEnforcement';

export function ProtectedRoute({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { user, sessionLoading } = useAuth();

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  // Force password change on first login (admin-created accounts)
  if (user.mustChangePassword) {
    return <ForcePasswordChange />;
  }

  // Subscription enforcement temporarily deactivated - direct access to children
  return <>{children}</>;
}