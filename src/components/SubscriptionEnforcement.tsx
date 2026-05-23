import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { supabase } from '../lib/supabase';
import { normalizeRole } from '../lib/role-utils';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { AlertCircle, CreditCard, Lock, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const SUPPORT_REPORT_ENDPOINTS = ['/support/report-error', '/support/error-report', '/report-error', '/error-report'] as const;

const isRetryableSupportRouteError = (error: any) => {
  const status = typeof error?.status === 'number' ? error.status : 0;
  if (status === 404 || status === 405) return true;
  const message = String(error?.message || '').toLowerCase();
  return message.includes('route not found') || message.includes('method not allowed');
};

interface SubscriptionEnforcementProps {
  children: React.ReactNode;
}

export function SubscriptionEnforcement({ children }: SubscriptionEnforcementProps) {
  const { user, getToken } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isActive: boolean;
    checking: boolean;
    error: string | null;
    accountInactive: boolean;
    subscriptionInactive: boolean;
    canManageSubscription: boolean;
    autoRenewEligible: boolean;
    sessionRole: string | null;
  }>({
    isActive: true,
    checking: true,
    error: null,
    accountInactive: false,
    subscriptionInactive: false,
    canManageSubscription: false,
    autoRenewEligible: false,
    sessionRole: null,
  });

  useEffect(() => {
    async function checkSubscription() {
      // Read role from the raw Supabase session (always available, no API call)
      let sessionRole: string | null = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        sessionRole = normalizeRole(sessionData?.session?.user?.user_metadata?.role) || null;
      } catch { /* ignore */ }

      if (!user && !sessionRole) {
        setSubscriptionStatus({
          isActive: false,
          checking: false,
          error: null,
          accountInactive: false,
          subscriptionInactive: false,
          canManageSubscription: false,
          autoRenewEligible: false,
          sessionRole,
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
          sessionRole,
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
          sessionRole,
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
    // SuperAdmin should always be able to access the dashboard (including the billing
    // tab) so they can renew/purchase without being blocked.  Showing the locked
    // screen while they are mid-interaction (e.g. the licence-selector dialog is open)
    // appeared as a spurious "logout".  Let them through and let the dashboard's own
    // billing tab surface the renewal options.
    const isSuperAdmin =
      normalizeRole(user?.role) === 'superadmin' ||
      subscriptionStatus.sessionRole === 'superadmin';
    if (isSuperAdmin) {
      return <>{children}</>;
    }
    return <SubscriptionLockedScreen canPay={subscriptionStatus.canManageSubscription} autoRenewEligible={subscriptionStatus.autoRenewEligible} />;
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

// ─── Subscription Locked Screen ─────────────────────────────────────────────
function SubscriptionLockedScreen({ canPay, autoRenewEligible }: { canPay: boolean; autoRenewEligible: boolean }) {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [autoRenewing, setAutoRenewing] = useState(false);

  const submitSupportRequest = async () => {
    if (!supportForm.message.trim()) {
      toast.error('Please describe your issue');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      const session = !token ? await supabase.auth.getSession().catch(() => null) : null;
      const resolvedToken = token || session?.data?.session?.access_token || null;
      if (!resolvedToken) throw new Error('Missing authentication token');

      const payload = {
        source: 'subscription_locked',
        location: window.location.pathname,
        message: supportForm.message,
        details: [
          `Contact name: ${supportForm.name || 'N/A'}`,
          `User email: ${user?.email || 'N/A'}`,
          `User role: ${user?.role || 'N/A'}`,
        ].join('\n'),
        context: {
          type: 'subscription_locked',
          subject: 'Subscription Payment Required — System Locked',
          contactName: supportForm.name || '',
          userEmail: user?.email || '',
          userRole: user?.role || '',
        },
      };

      let lastError: any = null;
      let sent = false;
      for (const endpoint of SUPPORT_REPORT_ENDPOINTS) {
        try {
          await api(endpoint, {
            method: 'POST',
            token: resolvedToken,
            body: payload,
          });
          sent = true;
          break;
        } catch (error: any) {
          lastError = error;
          if (!isRetryableSupportRouteError(error)) break;
        }
      }
      if (!sent) throw lastError || new Error('Failed to send support request');

      toast.success('Support request sent to our team — we will contact you shortly.');
      setShowSupportForm(false);
      setSupportForm((prev) => ({ ...prev, message: '' }));
    } catch (error: any) {
      toast.error(
        error?.message?.toLowerCase().includes('authentication')
          ? 'Your session expired. Please sign in again and retry.'
          : 'Failed to send support request. Please try again later.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const attemptAutoRenew = async () => {
    setAutoRenewing(true);
    try {
      const token = await getToken();
      await api('/subscription/renew', { method: 'POST', token, body: { autoRenew: true } });
      toast.success('Auto-renewal initiated — refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Auto-renewal failed. Please renew manually on the subscription page.');
    } finally {
      setAutoRenewing(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-red-50 to-pink-50">
      <div className="max-w-lg w-full space-y-4">
        <Alert variant="destructive" className="border-2">
          <CreditCard className="h-5 w-5" />
          <AlertTitle className="text-xl font-bold">Payment Required — System Locked</AlertTitle>
          <AlertDescription className="mt-3 space-y-4">
            <div className="bg-white/50 p-4 rounded-lg">
              <p className="font-semibold text-lg mb-2">🔒 System-Wide Access Suspended</p>
              <p className="text-sm">
                The organization's subscription is inactive. All system functions are disabled until payment is completed.
              </p>
            </div>

            {canPay ? (
              /* SuperAdmin / subscription owner: show payment options */
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="font-bold text-red-900 mb-1">💳 Action required</p>
                  <p className="text-sm text-red-900">
                    Renew your subscription to restore access for all users immediately.
                  </p>
                </div>

                <Button className="w-full" onClick={() => navigate('/subscription')}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Go to Subscription & Renew Now
                </Button>

                {autoRenewEligible && (
                  <Button variant="outline" className="w-full" onClick={attemptAutoRenew} disabled={autoRenewing}>
                    {autoRenewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    {autoRenewing ? 'Processing auto-renewal…' : 'Auto-renew with saved card'}
                  </Button>
                )}

                {autoRenewEligible && (
                  <p className="text-xs text-center text-muted-foreground">
                    Auto-renewal will charge your saved payment method. You can also add a new card on the subscription page.
                  </p>
                )}
              </div>
            ) : (
              /* Non-superadmin: show instructions */
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="font-bold text-red-900 mb-2">💳 Subscription Payment Required</p>
                <p className="text-sm text-red-900 mb-3">
                  Your SuperAdmin must complete payment to restore system access for all users.
                </p>
                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="text-xs font-semibold text-red-900">URGENT ACTION NEEDED:</p>
                  <ul className="text-xs text-red-900 mt-1 space-y-1">
                    <li>✓ Contact your SuperAdmin immediately</li>
                    <li>✓ Ask them to renew the subscription</li>
                    <li>✓ Payment must be completed to unlock the system</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="text-center pt-1">
              <p className="text-sm font-bold text-red-700 animate-pulse">
                ⏰ System will remain locked until payment is completed
              </p>
            </div>

            {/* Contact Support */}
            <div className="border-t pt-3">
              {!showSupportForm ? (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowSupportForm(true)}>
                  <MessageSquare className="w-3.5 h-3.5 mr-2" />
                  Contact Blumebyte Support
                </Button>
              ) : (
                <div className="space-y-2 bg-white p-3 rounded-lg border">
                  <p className="text-xs font-semibold text-gray-700">Send a support request to our team</p>
                  <Textarea
                    aria-label="Describe your issue"
                    placeholder="Describe your issue (company name, subscription plan, what happened)…"
                    value={supportForm.message}
                    onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))}
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowSupportForm(false)}>Cancel</Button>
                    <Button size="sm" className="flex-1" onClick={submitSupportRequest} disabled={submitting}>
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <MessageSquare className="w-3.5 h-3.5 mr-1" />}
                      Send Request
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
