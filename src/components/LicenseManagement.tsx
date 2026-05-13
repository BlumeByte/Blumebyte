import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api-client.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import {
  Users, CreditCard, AlertTriangle, CheckCircle, 
  Loader2, ShoppingCart, Zap, TrendingUp
} from 'lucide-react';
import { useBranding, brandGradientStyle } from '../lib/branding-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { UserLicenseSelector } from './UserLicenseSelector';

interface LicenseManagementProps {
  onClose?: () => void;
  requiredLicenses?: number; // If trying to create user and need more licenses
}

export function LicenseManagement({ onClose, requiredLicenses }: LicenseManagementProps) {
  const MIN_LICENSES = 2; // Minimum purchase quantity enforced by the server
  const PRICE_MONTHLY = 3.55;  // USD per license/month
  const PRICE_YEARLY = 30.60;  // USD per license/year ($2.55/month billed annually)
  const { branding } = useBranding();
  const { accessToken, getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingLicenses, setFetchingLicenses] = useState(true);
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [additionalLicenses, setAdditionalLicenses] = useState(Math.max(MIN_LICENSES, requiredLicenses || MIN_LICENSES));
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [saveCard, setSaveCard] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // User selection states
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [autoSyncedLicenses, setAutoSyncedLicenses] = useState(false);
  const [testingPaystack, setTestingPaystack] = useState(false);
  
  // Payment window tracking
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const paymentWindowRef = React.useRef<Window | null>(null);
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [activatingLicenses, setActivatingLicenses] = useState(false);
  const [pendingPaymentType, setPendingPaymentType] = useState<'license' | 'renewal' | null>(null);

  // Renewal state
  const [renewPlan, setRenewPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [renewLicenses, setRenewLicenses] = useState<number>(0); // 0 = not yet loaded; updated after fetchLicenseInfo
  const [renewLoading, setRenewLoading] = useState(false);

  // Card management state
  const [removingCard, setRemovingCard] = useState(false);
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);
  const [changingCard, setChangingCard] = useState(false);

  useEffect(() => {
    fetchLicenseInfo();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Start polling for payment completion
  const startPaymentPolling = (reference: string, paymentType: 'license' | 'renewal') => {
    // Clear any existing poll
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setPendingPaymentType(paymentType);
    setPollingStatus('Waiting for payment...');

    pollingRef.current = setInterval(async () => {
      try {
        // Use getToken() to always get the freshest token — the closure-captured
        // accessToken may be stale if the auth context refreshed it mid-poll.
        const freshToken = await getToken();
        if (!freshToken) {
          return;
        }

        const response = await apiClient.get(
          `/subscription/check-payment-status?reference=${encodeURIComponent(reference)}`,
          freshToken
        );
        if (!response.ok) return;

        const data = await response.json();

        if (data.status === 'completed') {
          // Already processed by the verification page in the payment tab
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus(null);
          setPaymentCompleted(true);
          setPaymentWindowOpened(false);
          setPendingPaymentType(null);
          toast.success(
            paymentType === 'renewal'
              ? 'Payment verified and subscription renewed!'
              : 'Payment verified and licenses activated!',
            { duration: 5000 }
          );
          fetchLicenseInfo();
          if (paymentType === 'license') {
            autoSyncAfterPayment();
          }
        } else if (data.status === 'paid') {
          // Payment succeeded on Paystack but not yet processed — verify now
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus(
            paymentType === 'renewal'
              ? 'Payment received! Completing renewal...'
              : 'Payment received! Activating licenses...'
          );
          if (paymentType === 'renewal') {
            await verifyRenewal(reference);
          } else {
            await verifyAndActivate(reference);
          }
        } else if (data.status === 'failed') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus(null);
          setPaymentWindowOpened(false);
          setPendingReference(null);
          setPendingPaymentType(null);
          toast.error(`Payment ${data.paystackStatus || 'failed'}. Please try again.`);
        }
        // 'pending' or 'unknown' — keep polling
      } catch (err) {
        console.error('Payment poll error:', err);
      }
    }, 4000); // Poll every 4 seconds
  };

  // Verify payment and activate licenses from the main app tab
  const verifyAndActivate = async (reference: string) => {
    try {
      setActivatingLicenses(true);
      setPollingStatus('Verifying payment and activating licenses...');

      const response = await apiClient.post(
        '/subscription/verify-license',
        { reference },
        accessToken
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentCompleted(true);
          setPaymentWindowOpened(false);
          setPendingReference(null);
          setPollingStatus(null);
          setPendingPaymentType(null);
          const licensesText = data.licensesAdded === 1 ? 'license' : 'licenses';
          toast.success(
            `Payment successful! ${data.licensesAdded} ${licensesText} activated.`,
            { duration: 6000 }
          );
          fetchLicenseInfo();
          // Auto-sync licenses
          await autoSyncAfterPayment();
        } else {
          setPollingStatus(null);
          toast.error(data.message || 'Verification failed');
        }
      } else {
        const error = await response.json();
        // If already processed, treat as success
        if (error.message?.includes('already been processed')) {
          setPaymentCompleted(true);
          setPaymentWindowOpened(false);
          setPendingReference(null);
          setPollingStatus(null);
          setPendingPaymentType(null);
          toast.success('Payment already processed and licenses activated!');
          fetchLicenseInfo();
        } else if (error.processing) {
          // Another request (e.g. the verification tab) is processing this payment right now.
          // Wait a few seconds then check the final result.
          setPollingStatus('Payment is being processed by another tab, please wait...');
          await new Promise(r => setTimeout(r, 4000));
          // After waiting, the subscription should have been updated
          const freshToken = await getToken();
          const checkRes = await apiClient.get(
            `/subscription/check-payment-status?reference=${encodeURIComponent(reference)}`,
            freshToken
          );
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.status === 'completed') {
              setPaymentCompleted(true);
              setPaymentWindowOpened(false);
              setPendingReference(null);
              setPollingStatus(null);
              setPendingPaymentType(null);
              toast.success('Payment verified and licenses activated!');
              fetchLicenseInfo();
              await autoSyncAfterPayment();
              return;
            }
          }
          setPollingStatus(null);
          toast.info('Payment is still being processed. It should complete shortly.');
        } else {
          setPollingStatus(null);
          toast.error(error.message || 'Verification failed');
        }
      }
    } catch (err: any) {
      console.error('Verify and activate error:', err);
      setPollingStatus(null);
      toast.error('Failed to verify payment. You can retry from the dashboard.');
    } finally {
      setActivatingLicenses(false);
    }
  };

  const verifyRenewal = async (reference: string) => {
    try {
      setActivatingLicenses(true);
      setPollingStatus('Verifying payment and renewing subscription...');

      const freshToken = await getToken();
      if (!freshToken) {
        throw new Error('Not authenticated');
      }

      const response = await apiClient.post(
        '/subscription/verify',
        { reference },
        freshToken
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Renewal verification failed');
      }

      setPaymentCompleted(true);
      setPaymentWindowOpened(false);
      setPendingReference(null);
      setPollingStatus(null);
      setPendingPaymentType(null);
      toast.success('Subscription renewed successfully!', { duration: 6000 });
      fetchLicenseInfo();
    } catch (err: any) {
      console.error('Verify renewal error:', err);
      setPollingStatus(null);
      toast.error(err.message || 'Failed to verify renewal. You can retry from the dashboard.');
    } finally {
      setActivatingLicenses(false);
    }
  };

  // Auto-sync user licenses after successful payment
  const autoSyncAfterPayment = async () => {
    try {
      const response = await apiClient.post('/sync-user-licenses', {}, accessToken);
      if (response.ok) {
        const result = await response.json();
        if (result.activatedCount > 0 || result.deactivatedCount > 0) {
          toast.success(
            `Licenses synced! Activated: ${result.activatedCount}, Deactivated: ${result.deactivatedCount}`,
            { duration: 4000 }
          );
        }
      }
    } catch (err) {
      console.error('Auto-sync error:', err);
    }
  };

  // Auto-sync license count with current users
  useEffect(() => {
    if (licenseInfo && !autoSyncedLicenses) {
      const currentUsers = licenseInfo.usedLicenses;
      
      // If there are existing users, auto-sync the license count
      if (currentUsers > 0) {
        // Set to current users or minimum of 2, whichever is higher
        const syncedCount = Math.max(MIN_LICENSES, currentUsers, requiredLicenses || 0);
        setAdditionalLicenses(syncedCount);
        setAutoSyncedLicenses(true);
        
        
        // Show a toast notification
        if (currentUsers > licenseInfo.purchasedLicenses) {
          toast.info(
            `You have ${currentUsers} users but only ${licenseInfo.purchasedLicenses} licenses. License count auto-adjusted to ${syncedCount}.`,
            { duration: 5000 }
          );
        }
      }
    }
  }, [licenseInfo, autoSyncedLicenses, requiredLicenses]);

  const fetchLicenseInfo = async () => {
    try {
      setFetchingLicenses(true);
      const response = await apiClient.get('/subscription/license-info', accessToken);
      if (response.ok) {
        const data = await response.json();
        setLicenseInfo({
          ...data,
          endDate: data.endDate ?? null,
        });
        // Seed renewLicenses from loaded data (only if not yet set by user)
        setRenewLicenses(prev => prev <= 0 ? Math.max(MIN_LICENSES, data.purchasedLicenses || MIN_LICENSES) : prev);
      }
    } catch (error) {
      console.error('Error fetching license info:', error);
      toast.error('Failed to fetch license information');
    } finally {
      setFetchingLicenses(false);
    }
  };

  const handleSyncLicenses = async () => {
    try {
      setSyncing(true);
      const freshToken = await getToken();
      const response = await apiClient.post('/sync-user-licenses', {}, freshToken);
      
      if (response.ok) {
        const result = await response.json();
        if (result.activatedCount > 0 || result.deactivatedCount > 0) {
          toast.success(
            `License sync complete! Activated: ${result.activatedCount}, Deactivated: ${result.deactivatedCount}`
          );
        } else {
          toast.success('All licenses are up to date — no changes needed.');
        }
        fetchLicenseInfo(); // Refresh license info
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to sync licenses');
      }
    } catch (error: any) {
      console.error('Error syncing licenses:', error);
      toast.error(error.message || 'Failed to sync licenses');
    } finally {
      setSyncing(false);
    }
  };

  const handleRenewLicense = async () => {
    const payWindow = window.open('', '_blank');
    if (payWindow) {
      payWindow.document.write(`<html><head><title>Connecting to Paystack...</title>
        <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);color:#fff;margin:0}
        .s{width:48px;height:48px;border:4px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:24px}
        @keyframes spin{to{transform:rotate(360deg)}}h2{margin:0 0 8px}p{opacity:.8}</style></head>
        <body><div class="s"></div><h2>Connecting to Paystack…</h2><p>Preparing your renewal…</p></body></html>`);
      payWindow.document.close();
    }
    try {
      setRenewLoading(true);
      const freshToken = await getToken();
      if (!freshToken) { payWindow?.close(); toast.error('Not authenticated'); return; }

      const licenses = Math.max(MIN_LICENSES, renewLicenses > 0 ? renewLicenses : (licenseInfo?.purchasedLicenses || MIN_LICENSES));
      const pricePerUser = renewPlan === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY;
      const amount = licenses * pricePerUser;

      const response = await apiClient.post('/subscription/renew-license', {
        licenses,
        plan: renewPlan,
        amount,
        saveCard,
      }, freshToken);

      if (!response.ok) {
        const error = await response.json();
        payWindow?.close();
        throw new Error(error.error || error.message || 'Failed to initialize renewal');
      }
      const data = await response.json();
      if (data.authorization_url) {
        if (payWindow && !payWindow.closed) {
          payWindow.location.href = data.authorization_url;
        } else {
          window.location.href = data.authorization_url;
        }
        if (data.reference) {
          setPendingReference(data.reference);
          setPaymentWindowOpened(true);
          setPaymentCompleted(false);
          if (payWindow) paymentWindowRef.current = payWindow;
          startPaymentPolling(data.reference, 'renewal');
        }
      } else {
        payWindow?.close();
        throw new Error('No payment URL received');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start renewal');
    } finally {
      setRenewLoading(false);
    }
  };

  const handleRemoveCard = async () => {
    if (!window.confirm('Remove saved card? Auto-renewal will be disabled.')) return;
    setRemovingCard(true);
    try {
      const freshToken = await getToken();
      if (!freshToken) { toast.error('Not authenticated'); return; }
      const response = await apiClient.delete('/subscription/card', freshToken);
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed to remove card'); }
      toast.success('Card removed. Auto-renewal disabled.');
      fetchLicenseInfo();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove card');
    } finally {
      setRemovingCard(false);
    }
  };

  const handleChangeCard = async () => {
    if (!window.confirm(
      'This will remove your current saved card and disable auto-renewal.\n\n' +
      'To use a new card: make your next payment (renewal or license purchase) ' +
      'and check "Save card for auto-renewal" to save the new card.\n\n' +
      'Remove current card now?'
    )) return;
    setChangingCard(true);
    try {
      const freshToken = await getToken();
      if (!freshToken) { toast.error('Not authenticated'); return; }
      const response = await apiClient.delete('/subscription/card', freshToken);
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed to remove card'); }
      toast.success('Card removed. Please make your next payment with the new card and check "Save card for auto-renewal" to save it.');
      fetchLicenseInfo();
    } catch (e: any) {
      toast.error(e.message || 'Failed to change card');
    } finally {
      setChangingCard(false);
    }
  };

  const handleToggleAutoRenew = async (enable: boolean) => {
    setTogglingAutoRenew(true);
    try {
      const freshToken = await getToken();
      if (!freshToken) { toast.error('Not authenticated'); return; }
      const response = await apiClient.patch('/subscription/auto-renew', { enabled: enable }, freshToken);
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Failed to update auto-renewal'); }
      toast.success(enable ? 'Auto-renewal enabled.' : 'Auto-renewal disabled.');
      fetchLicenseInfo();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update auto-renewal');
    } finally {
      setTogglingAutoRenew(false);
    }
  };

  const handlePurchaseLicenses = async () => {
    if (additionalLicenses < MIN_LICENSES) {
      toast.error(`Minimum purchase is ${MIN_LICENSES} licenses`);
      return;
    }

    // Open a blank tab IMMEDIATELY on user click — before any async work.
    // This is the only reliable way to open a new tab from an async flow:
    // popup blockers only allow window.open() when it's synchronous with a user gesture.
    // We write a loading page into it, then navigate it to Paystack once we have the URL.
    const payWindow = window.open('', '_blank');
    if (payWindow) {
      payWindow.document.write(`
        <html>
          <head><title>Connecting to Paystack...</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                   display: flex; flex-direction: column; align-items: center;
                   justify-content: center; min-height: 100vh; margin: 0;
                   background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%); color: #fff; }
            .spinner { width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.3);
                       border-top-color: #fff; border-radius: 50%;
                       animation: spin 0.8s linear infinite; margin-bottom: 24px; }
            @keyframes spin { to { transform: rotate(360deg); } }
            h2 { margin: 0 0 8px; font-size: 1.4rem; }
            p  { margin: 0; opacity: 0.8; font-size: 0.95rem; }
          </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>Connecting to Paystack…</h2>
            <p>Please wait while we prepare your payment.</p>
          </body>
        </html>`);
      payWindow.document.close();
    }

    try {
      setLoading(true);

      // Check if we need user selection (new total licenses would still be fewer than active users)
      const currentActiveUsers = licenseInfo?.usedLicenses || 0;
      const currentPurchased = licenseInfo?.purchasedLicenses || 0;
      const newTotalLicenses = currentPurchased + additionalLicenses;
      
      if (currentActiveUsers > newTotalLicenses) {
        // Need to select which users to keep active — fetch users first
        setFetchingUsers(true);
        const freshToken = await getToken();
        const usersResponse = await apiClient.get('/subscription/all-users', freshToken);
        
        if (!usersResponse.ok) {
          payWindow?.close();
          throw new Error('Failed to fetch users');
        }
        
        const usersData = await usersResponse.json();
        setAllUsers(usersData.users);
        setFetchingUsers(false);
        setLoading(false);
        payWindow?.close(); // close the blank tab; user must pick users first
        setShowUserSelector(true);
        return;
      }

      // No user selection needed — proceed directly to payment
      await proceedWithPayment([], payWindow);
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      payWindow?.close();
      toast.error(error.message || 'Failed to initialize payment');
      setLoading(false);
      setFetchingUsers(false);
    }
  };
  
  const proceedWithPayment = async (selectedUserIds: string[], payWindow?: Window | null) => {
    try {
      setLoading(true);
      
      // Always get a fresh token to avoid stale auth errors
      const freshToken = await getToken();
      if (!freshToken) {
        payWindow?.close();
        throw new Error('Not authenticated. Please log in again.');
      }

      const pricePerUser = selectedPlan === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY;
      // Ensure additionalLicenses is a valid integer (guard against NaN from bad input)
      const safeLicenses = Number.isFinite(additionalLicenses) ? Math.max(MIN_LICENSES, Math.round(additionalLicenses)) : MIN_LICENSES;
      const totalAmount = safeLicenses * pricePerUser;


      const endpoint = selectedUserIds.length > 0 
        ? '/subscription/purchase-licenses-with-selection'
        : '/subscription/purchase-licenses';

      const payload = {
        licenses: safeLicenses,
        plan: selectedPlan,
        amount: totalAmount,
        saveCard,
        ...(selectedUserIds.length > 0 && { selectedUserIds }),
      };

      const response = await apiClient.post(endpoint, payload, freshToken);

      if (!response.ok) {
        const error = await response.json();
        console.error('Payment initialization failed:', error);
        payWindow?.close();
        throw new Error(error.error || error.message || 'Failed to initialize payment');
      }

      const data = await response.json();

      if (data.authorization_url) {
        if (payWindow && !payWindow.closed) {
          // Navigate the already-open tab to Paystack
          payWindow.location.href = data.authorization_url;
        } else {
          // Tab was closed or blocked — fall back to same-window navigation
          window.location.href = data.authorization_url;
        }
        setLoading(false);

        // Track the payment window and start polling for completion
        const reference = data.reference;
        if (reference) {
          setPendingReference(reference);
          setPaymentWindowOpened(true);
          setPaymentCompleted(false);
          if (payWindow) paymentWindowRef.current = payWindow;
          startPaymentPolling(reference, 'license');
        }
      } else {
        payWindow?.close();
        throw new Error('No payment URL received from server');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      payWindow?.close();
      
      let errorMessage = error.message || 'Failed to initialize payment';
      if (errorMessage.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid key')) {
        errorMessage = 'Payment gateway configuration error. Please contact support.';
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };
  
  const handleUserSelectionConfirm = (selectedUserIds: string[]) => {
    setShowUserSelector(false);
    // For user selection flow, open the tab here (user clicked Confirm — still a gesture)
    const payWindow = window.open('', '_blank');
    if (payWindow) {
      payWindow.document.write(`
        <html><head><title>Connecting to Paystack...</title>
        <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;
        justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);color:#fff;margin:0}
        .s{width:48px;height:48px;border:4px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;
        animation:spin .8s linear infinite;margin-bottom:24px}
        @keyframes spin{to{transform:rotate(360deg)}}h2{margin:0 0 8px}p{opacity:.8}</style></head>
        <body><div class="s"></div><h2>Connecting to Paystack…</h2><p>Preparing your payment…</p></body></html>`);
      payWindow.document.close();
    }
    proceedWithPayment(selectedUserIds, payWindow);
  };

  const handleTestPaystack = async () => {
    try {
      setTestingPaystack(true);
      const response = await apiClient.post('/subscription/test-paystack', {}, accessToken);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Paystack test failed:', error);
        toast.error(`Paystack test failed: ${error.error || 'Unknown error'}`);
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Paystack connection successful! Payment gateway is working correctly.');
      } else {
        toast.error(`Paystack test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error testing Paystack:', error);
      toast.error(`Test failed: ${error.message || 'Unknown error'}`);
    } finally {
      setTestingPaystack(false);
    }
  };

  const pricePerUser = selectedPlan === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY;
  const totalCost = additionalLicenses * pricePerUser;
  const monthlyEquivalent = selectedPlan === 'yearly' ? (totalCost / 12).toFixed(2) : totalCost;

  const EXPIRY_WARNING_DAYS = 14; // Show renewal section this many days before expiry

  const licenseExpiryDate = licenseInfo?.endDate || null;

  const isLicenseExpired = licenseInfo != null && (
    licenseInfo.licenseStatus === 'expired' ||
    licenseInfo.status === 'expired' ||
    (licenseExpiryDate && new Date(licenseExpiryDate) < new Date())
  );

  // Show renewal section when expired OR expiring within EXPIRY_WARNING_DAYS days
  const isLicenseExpiringSoon = licenseInfo != null && !isLicenseExpired && (
    licenseExpiryDate && (() => {
      const daysLeft = (new Date(licenseExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysLeft <= EXPIRY_WARNING_DAYS;
    })()
  );

  const usagePercentage = licenseInfo && licenseInfo.purchasedLicenses > 0
    ? Math.min((licenseInfo.usedLicenses / licenseInfo.purchasedLicenses) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Current License Status */}
      {!fetchingLicenses && licenseInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Current License Usage
            </CardTitle>
            <CardDescription>Your organization's user license allocation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Purchased</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{licenseInfo.purchasedLicenses || 0}</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Used</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{licenseInfo.usedLicenses || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Available</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{licenseInfo.availableLicenses || 0}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">License Utilization</span>
                <span className="font-medium">{usagePercentage.toFixed(0)}%</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>

            {licenseInfo.availableLicenses < 3 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  You're running low on licenses! Purchase more to add new users.
                </AlertDescription>
              </Alert>
            )}

            {licenseInfo.availableLicenses === 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  No licenses available. You must purchase more licenses to add new users.
                </AlertDescription>
              </Alert>
            )}

            {licenseInfo.cardSaved && (
              <div className="space-y-2 bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        {licenseInfo.autoRenew !== false ? 'Auto-renewal enabled' : 'Auto-renewal paused'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {licenseInfo.cardBrand ? `${licenseInfo.cardBrand} ` : ''}Card ending in {licenseInfo.cardLast4} • Expires {licenseInfo.cardExpiry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      disabled={togglingAutoRenew}
                      onClick={() => handleToggleAutoRenew(licenseInfo.autoRenew === false)}
                      title={licenseInfo.autoRenew !== false ? 'Pause auto-renewal' : 'Enable auto-renewal'}
                    >
                      {togglingAutoRenew ? <Loader2 className="w-3 h-3 animate-spin" /> : (licenseInfo.autoRenew !== false ? 'Pause' : 'Enable')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      disabled={changingCard}
                      onClick={handleChangeCard}
                      title="Change saved card"
                    >
                      {changingCard ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Change card'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={removingCard}
                      onClick={handleRemoveCard}
                      title="Remove saved card"
                    >
                      {removingCard ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Remove card'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Sync Licenses Button */}
            <div className="space-y-2">
              <Button 
                onClick={handleSyncLicenses} 
                disabled={syncing}
                variant="outline"
                className="w-full"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Sync User Licenses
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Activate/deactivate users based on available licenses
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase More Licenses */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Add More Licenses
            </CardTitle>
            <CardDescription>
              {requiredLicenses 
                ? `You need at least ${requiredLicenses} more license(s) to proceed`
                : 'Purchase extra seats only. Subscription renewal is handled separately below.'}
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          {/* Number of Licenses */}
          <div className="space-y-2">
            <Label>Number of Licenses (Minimum: 2)</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdditionalLicenses(Math.max(MIN_LICENSES, additionalLicenses - 1))}
                disabled={additionalLicenses <= MIN_LICENSES}
              >
                -
              </Button>
              <Input
                type="number"
                min={String(MIN_LICENSES)}
                value={additionalLicenses}
                onChange={(e) => setAdditionalLicenses(Math.max(MIN_LICENSES, parseInt(e.target.value) || MIN_LICENSES))}
                className="text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdditionalLicenses(additionalLicenses + 1)}
              >
                +
              </Button>
            </div>
            {autoSyncedLicenses && licenseInfo?.usedLicenses > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <Zap className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="text-sm">
                    Auto-synced to {additionalLicenses} licenses based on your {licenseInfo.usedLicenses} current user(s).
                  </p>
                </AlertDescription>
              </Alert>
            )}
            {!autoSyncedLicenses && (
              <p className="text-xs text-muted-foreground">
                Minimum purchase: 2 licenses. Each license allows you to add one user (SuperAdmin, Admin, Manager, or Employee)
              </p>
            )}
          </div>

          {/* Plan Selection */}
          <div className="space-y-3">
            <Label>Billing Cycle</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Monthly Plan */}
              <Card
                className={`cursor-pointer transition-all ${
                  selectedPlan === 'monthly'
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Monthly</p>
                      <p className="text-xs text-muted-foreground">Pay as you go</p>
                    </div>
                    {selectedPlan === 'monthly' && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">${PRICE_MONTHLY.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">per license/month</p>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card
                className={`cursor-pointer transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Yearly</p>
                      <p className="text-xs text-muted-foreground">Billed annually</p>
                    </div>
                    {selectedPlan === 'yearly' && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">${(PRICE_YEARLY / 12).toFixed(2)}<span className="text-base text-muted-foreground">/month</span></p>
                  <p className="text-xs text-muted-foreground">billed annually at ${PRICE_YEARLY.toFixed(2)}/year</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Save Card for Auto-Renewal */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <input
              type="checkbox"
              id="saveCard"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="saveCard" className="font-medium text-sm cursor-pointer">
                Save card for auto-renewal
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Your subscription will automatically renew at the end of the billing cycle. 
                You can cancel anytime.
              </p>
            </div>
          </div>

          <Separator />

          {/* Cost Summary */}
          <div className="space-y-3 bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Licenses</span>
              <span className="font-semibold">{additionalLicenses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price per license</span>
              <span className="font-semibold">
                ${pricePerUser.toFixed(2)}/{selectedPlan === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Total</span>
              <div className="text-right">
                <span className="font-bold text-2xl" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}>
                  ${totalCost.toFixed(2)}
                </span>
                {selectedPlan === 'yearly' && (
                  <p className="text-xs text-muted-foreground">${Number(monthlyEquivalent).toFixed(2)}/month</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment in Progress Banner */}
          {paymentWindowOpened && !paymentCompleted && (
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {activatingLicenses ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-900 mb-1">
                        {activatingLicenses ? 'Activating Licenses...' : 'Payment in Progress'}
                      </p>
                      <p className="text-sm text-blue-700 mb-2">
                        {pollingStatus || (
                          pendingPaymentType === 'renewal'
                            ? 'Complete your renewal in the Paystack tab. Once paid, your subscription will be updated automatically.'
                            : 'Complete your payment in the Paystack tab. Once paid, your licenses will be activated automatically — just close the payment tab and come back here.'
                        )}
                      </p>
                    {pollingStatus && (
                      <div className="flex items-center gap-2 mb-3">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">{pollingStatus}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-400 text-blue-800 hover:bg-blue-100"
                        onClick={() => {
                          if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
                            paymentWindowRef.current.focus();
                          } else {
                            toast.info('The payment tab was closed. We are still monitoring for payment completion.');
                          }
                        }}
                      >
                        Switch to Payment Tab
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-400 text-green-800 hover:bg-green-100"
                        disabled={activatingLicenses}
                        onClick={() => {
                          if (pendingReference) {
                            verifyAndActivate(pendingReference);
                          }
                        }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        I've Paid — Verify Now
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-500"
                        onClick={() => {
                          if (pollingRef.current) {
                            clearInterval(pollingRef.current);
                            pollingRef.current = null;
                          }
                          setPaymentWindowOpened(false);
                          setPendingReference(null);
                          setPollingStatus(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Completed Success Banner */}
          {paymentCompleted && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-900 mb-1">Licenses Activated Successfully!</p>
                    <p className="text-sm text-green-700 mb-2">
                      Your payment has been verified and licenses are now active. You can close the payment tab if it's still open.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-400 text-green-800 hover:bg-green-100"
                      onClick={() => setPaymentCompleted(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onClose && (
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              onClick={handlePurchaseLicenses}
              disabled={loading || additionalLicenses < MIN_LICENSES}
              style={brandGradientStyle(branding?.primaryColor || '#1d4ed8')}
              className="text-white flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase {additionalLicenses} License{additionalLicenses !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Secure payment powered by Paystack</span>
            </div>
          </div>

          {/* Test Paystack Connection */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleTestPaystack}
              disabled={testingPaystack}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {testingPaystack ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Test Paystack Connection
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Having payment issues? Click to test Paystack integration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Renew License — shown when license is expired or expiring within 14 days */}
      {licenseInfo && (isLicenseExpired || isLicenseExpiringSoon) && (
        <Card className={isLicenseExpired ? "border-orange-200 bg-orange-50" : "border-yellow-200 bg-yellow-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isLicenseExpired ? 'text-orange-800' : 'text-yellow-800'}`}>
              <TrendingUp className="w-5 h-5" />
              {isLicenseExpired ? 'Renew Current Subscription' : 'Current Subscription Expiring Soon'}
            </CardTitle>
            <p className={`text-sm ${isLicenseExpired ? 'text-orange-700' : 'text-yellow-700'}`}>
              {isLicenseExpired
                ? 'Your license has expired. Renew now to restore access for your team.'
                : `Your license expires on ${new Date(licenseExpiryDate).toLocaleDateString()}. Renew early to avoid interruption.`}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Number of Licenses to Renew */}
            <div className="space-y-2">
              <Label className={isLicenseExpired ? 'text-orange-800' : 'text-yellow-800'}>
                Licenses to Renew
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRenewLicenses(Math.max(MIN_LICENSES, renewLicenses - 1))}
                  disabled={renewLicenses === 0 || renewLicenses <= MIN_LICENSES}
                >-</Button>
                <Input
                  type="number"
                  min={String(MIN_LICENSES)}
                  value={renewLicenses > 0 ? renewLicenses : (licenseInfo?.purchasedLicenses || MIN_LICENSES)}
                  onChange={e => setRenewLicenses(Math.max(MIN_LICENSES, parseInt(e.target.value) || MIN_LICENSES))}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRenewLicenses((renewLicenses > 0 ? renewLicenses : (licenseInfo?.purchasedLicenses || MIN_LICENSES)) + 1)}
                >+</Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum {MIN_LICENSES} licenses. Defaults to your current purchased licenses.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${renewPlan === 'monthly' ? 'ring-2 ring-orange-500 shadow-lg' : 'hover:shadow-md'}`}
                onClick={() => setRenewPlan('monthly')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Monthly</p>
                      <p className="text-xs text-muted-foreground">Pay as you go</p>
                    </div>
                    {renewPlan === 'monthly' && <CheckCircle className="w-5 h-5 text-orange-500" />}
                  </div>
                  <p className="text-2xl font-bold">${PRICE_MONTHLY.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">per license/month</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all relative ${renewPlan === 'yearly' ? 'ring-2 ring-orange-500 shadow-lg' : 'hover:shadow-md'}`}
                onClick={() => setRenewPlan('yearly')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Yearly</p>
                        <p className="text-xs text-muted-foreground">Billed annually</p>
                    </div>
                    {renewPlan === 'yearly' && <CheckCircle className="w-5 h-5 text-orange-500" />}
                  </div>
                  <p className="text-2xl font-bold">${(PRICE_YEARLY / 12).toFixed(2)}<span className="text-base text-muted-foreground">/month</span></p>
                  <p className="text-xs text-muted-foreground">billed annually at ${PRICE_YEARLY.toFixed(2)}/year</p>
                </CardContent>
              </Card>
            </div>
            <div className="bg-orange-100 rounded-lg p-3 text-sm text-orange-800">
              Renewing <strong>{renewLicenses > 0 ? renewLicenses : (licenseInfo.purchasedLicenses || MIN_LICENSES)} license(s)</strong> for{' '}
              <strong>${((renewLicenses > 0 ? renewLicenses : (licenseInfo.purchasedLicenses || MIN_LICENSES)) * (renewPlan === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY)).toFixed(2)}</strong>{' '}
              ({renewPlan})
            </div>
            <Button
              onClick={handleRenewLicense}
              disabled={renewLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {renewLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" />Renew License</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* User License Selector Dialog */}
      {showUserSelector && (
        <UserLicenseSelector
          open={showUserSelector}
          onOpenChange={setShowUserSelector}
          users={allUsers}
          maxLicenses={(licenseInfo?.purchasedLicenses || 0) + additionalLicenses}
          additionalLicenses={additionalLicenses}
          currentPurchasedLicenses={licenseInfo?.purchasedLicenses || 0}
          onConfirm={handleUserSelectionConfirm}
          loading={loading}
        />
      )}
    </div>
  );
}

// Modal wrapper for license management
export function LicenseManagementModal({ 
  open, 
  onOpenChange, 
  requiredLicenses 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  requiredLicenses?: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>License Management</DialogTitle>
          <DialogDescription>
            Manage your user licenses and subscription
          </DialogDescription>
        </DialogHeader>
        <LicenseManagement onClose={() => onOpenChange(false)} requiredLicenses={requiredLicenses} />
      </DialogContent>
    </Dialog>
  );
}
