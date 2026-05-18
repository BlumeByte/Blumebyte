import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertCircle, CreditCard, Lock } from 'lucide-react';
import { useNavigate } from 'react-router';

interface SubscriptionEnforcementProps {
  children: React.ReactNode;
}

export function SubscriptionEnforcement({ children }: SubscriptionEnforcementProps) {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isActive: boolean;
    checking: boolean;
    error: string | null;
    accountInactive: boolean;
    subscriptionInactive: boolean;
    canManageSubscription: boolean;
    autoRenewEligible: boolean;
  }>({
    isActive: true,
    checking: true,
    error: null,
    accountInactive: false,
    subscriptionInactive: false,
    canManageSubscription: false,
    autoRenewEligible: false,
  });

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setSubscriptionStatus({
          isActive: false,
          checking: false,
          error: null,
          accountInactive: false,
          subscriptionInactive: false,
        });
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Missing authentication token');
        }

        const status = await api('/subscription/status', { token });
        
        setSubscriptionStatus({
          isActive: status?.status === 'active',
          checking: false,
          error: null,
          accountInactive: false,
          subscriptionInactive: status?.status !== 'active',
          canManageSubscription: status?.isSubscriptionOwner === true,
          autoRenewEligible: status?.autoRenewEligible === true,
        });
      } catch (error: any) {
        console.error('Subscription check failed:', error);
        
        setSubscriptionStatus({
          isActive: false,
          checking: false,
          error: error.message,
          accountInactive: error.accountInactive || false,
          subscriptionInactive: error.subscriptionInactive || false,
          canManageSubscription: false,
          autoRenewEligible: false,
        });
      }
    }

    checkSubscription();
    
    // Re-check every 5 minutes
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, getToken]);

  // Show loading state while checking
  if (subscriptionStatus.checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // SuperAdmin or active subscription - allow access
  if (subscriptionStatus.isActive) {
    return <>{children}</>;
  }

  // Account is inactive
  if (subscriptionStatus.accountInactive) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-lg w-full space-y-4">
          <Alert variant="destructive" className="border-2">
            <Lock className="h-5 w-5" />
            <AlertTitle className="text-xl font-bold">Account Inactive - Action Required</AlertTitle>
            <AlertDescription className="mt-3 space-y-4">
              <div className="bg-white/50 p-4 rounded-lg">
                <p className="font-semibold text-lg mb-2">⚠️ Your account has been deactivated</p>
                <p className="text-sm">
                  Your organization has insufficient user licenses or the subscription payment has failed.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="font-bold text-blue-900 mb-2">📞 What to do:</p>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-blue-900">
                  <li><strong>Contact your SuperAdmin immediately</strong></li>
                  <li>Request them to purchase additional licenses or renew the subscription</li>
                  <li>Once payment is complete, your access will be restored automatically</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-xs text-yellow-900">
                  <strong>Common reasons:</strong> License limit reached • Payment failed • Subscription expired • Admin action
                </p>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm font-bold text-red-700">
                  🚫 You cannot access the system until your SuperAdmin purchases licenses
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Subscription is inactive
  if (subscriptionStatus.subscriptionInactive) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="max-w-lg w-full space-y-4">
          <Alert variant="destructive" className="border-2">
            <CreditCard className="h-5 w-5" />
            <AlertTitle className="text-xl font-bold">Payment Required - System Locked</AlertTitle>
            <AlertDescription className="mt-3 space-y-4">
              <div className="bg-white/50 p-4 rounded-lg">
                <p className="font-semibold text-lg mb-2">🔒 System-Wide Access Suspended</p>
                <p className="text-sm">
                  The organization's subscription is inactive. All system functions are disabled.
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="font-bold text-red-900 mb-2">💳 Subscription Payment Required</p>
                <p className="text-sm text-red-900 mb-3">
                  Your SuperAdmin must complete payment to restore system access for all users.
                </p>
                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="text-xs font-semibold text-red-900">URGENT ACTION NEEDED:</p>
                  <ul className="text-xs text-red-900 mt-1 space-y-1">
                    <li>✓ Contact SuperAdmin immediately</li>
                    <li>✓ Ask them to renew the subscription</li>
                    <li>✓ Payment must be completed to unlock system</li>
                  </ul>
                </div>
              </div>

                <div className="text-center pt-2">
                  <p className="text-sm font-bold text-red-700 animate-pulse">
                    ⏰ System will remain locked until SuperAdmin completes payment
                  </p>
                </div>
                {subscriptionStatus.canManageSubscription && (
                  <Button className="w-full" onClick={() => navigate('/subscription')}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Go to Subscription & Renew
                  </Button>
                )}
                {subscriptionStatus.autoRenewEligible && (
                  <p className="text-xs text-center text-muted-foreground">
                    A saved-card auto-renewal can be attempted from your subscription page.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </div>
      </div>
    );
  }

  // Generic error
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Access Denied</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{subscriptionStatus.error || 'Unable to verify your account status.'}</p>
            <p className="font-medium">
              Please contact your system administrator for assistance.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-3"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
