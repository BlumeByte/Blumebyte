import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api-client.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
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
  const { branding } = useBranding();
  const { accessToken, getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingLicenses, setFetchingLicenses] = useState(true);
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [additionalLicenses, setAdditionalLicenses] = useState(Math.max(2, requiredLicenses || 2));
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
  const startPaymentPolling = (reference: string) => {
    // Clear any existing poll
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    console.log('Starting payment polling for reference:', reference);
    setPollingStatus('Waiting for payment...');

    pollingRef.current = setInterval(async () => {
      try {
        // Use getToken() to always get the freshest token — the closure-captured
        // accessToken may be stale if the auth context refreshed it mid-poll.
        const freshToken = await getToken();
        if (!freshToken) {
          console.warn('Payment poll: no valid token available, skipping this cycle');
          return;
        }

        const response = await apiClient.get(
          `/subscription/check-payment-status?reference=${encodeURIComponent(reference)}`,
          freshToken
        );
        if (!response.ok) return;

        const data = await response.json();
        console.log('Payment poll result:', data.status);

        if (data.status === 'completed') {
          // Already processed by the verification page in the payment tab
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus(null);
          setPaymentCompleted(true);
          setPaymentWindowOpened(false);
          toast.success('Payment verified and licenses activated!', { duration: 5000 });
          fetchLicenseInfo();
          // Auto-sync licenses
          autoSyncAfterPayment();
        } else if (data.status === 'paid') {
          // Payment succeeded on Paystack but not yet processed — verify now
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus('Payment received! Activating licenses...');
          await verifyAndActivate(reference);
        } else if (data.status === 'failed') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus(null);
          setPaymentWindowOpened(false);
          setPendingReference(null);
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

  // Auto-sync user licenses after successful payment
  const autoSyncAfterPayment = async () => {
    try {
      console.log('Auto-syncing licenses after payment...');
      const response = await apiClient.post('/sync-user-licenses', {}, accessToken);
      if (response.ok) {
        const result = await response.json();
        console.log('Auto-sync result:', result);
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
        const syncedCount = Math.max(2, currentUsers, requiredLicenses || 0);
        setAdditionalLicenses(syncedCount);
        setAutoSyncedLicenses(true);
        
        console.log(`Auto-synced licenses to ${syncedCount} based on ${currentUsers} current users`);
        
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
        setLicenseInfo(data);
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
      const response = await apiClient.post('/sync-user-licenses', {}, accessToken);
      
      if (response.ok) {
        const result = await response.json();
        toast.success(
          `License sync complete! Activated: ${result.activatedCount}, Deactivated: ${result.deactivatedCount}`
        );
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

  const handlePurchaseLicenses = async () => {
    if (additionalLicenses < 2) {
      toast.error('Minimum purchase is 2 licenses');
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

      // Check if we need user selection (buying fewer licenses than current active users)
      const currentActiveUsers = licenseInfo?.usedLicenses || 0;
      
      if (currentActiveUsers > additionalLicenses) {
        // Need to select which users to keep active — fetch users first
        setFetchingUsers(true);
        const usersResponse = await apiClient.get('/subscription/all-users', accessToken);
        
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
      
      const pricePerUser = selectedPlan === 'monthly' ? 6 : 60;
      const totalAmount = additionalLicenses * pricePerUser;

      console.log('Frontend: Initiating license purchase');
      console.log('- Licenses:', additionalLicenses, '| Plan:', selectedPlan, '| USD:', totalAmount);

      const endpoint = selectedUserIds.length > 0 
        ? '/subscription/purchase-licenses-with-selection'
        : '/subscription/purchase-licenses';

      const payload = {
        licenses: additionalLicenses,
        plan: selectedPlan,
        amount: totalAmount,
        saveCard,
        ...(selectedUserIds.length > 0 && { selectedUserIds }),
      };

      const response = await apiClient.post(endpoint, payload, accessToken);

      if (!response.ok) {
        const error = await response.json();
        console.error('Payment initialization failed:', error);
        payWindow?.close();
        throw new Error(error.error || error.message || 'Failed to initialize payment');
      }

      const data = await response.json();
      console.log('Payment init success. Authorization URL:', data.authorization_url);

      if (data.authorization_url) {
        if (payWindow && !payWindow.closed) {
          // Navigate the already-open tab to Paystack
          payWindow.location.href = data.authorization_url;
        } else {
          // Tab was closed or blocked — fall back to same-window navigation
          console.warn('Payment tab was closed or blocked; falling back to same-window redirect');
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
          startPaymentPolling(reference);
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
      console.log('Paystack test result:', result);
      
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

  const pricePerUser = selectedPlan === 'monthly' ? 6 : 60;
  const totalCost = additionalLicenses * pricePerUser;
  const monthlyEquivalent = selectedPlan === 'yearly' ? (totalCost / 12).toFixed(2) : totalCost;

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
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Purchased</p>
                <p className="text-2xl font-bold text-blue-600">{licenseInfo.purchasedLicenses || 0}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Used</p>
                <p className="text-2xl font-bold text-green-600">{licenseInfo.usedLicenses || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Available</p>
                <p className="text-2xl font-bold text-purple-600">{licenseInfo.availableLicenses || 0}</p>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Auto-renewal enabled</p>
                  <p className="text-xs">Card ending in {licenseInfo.cardLast4} • Expires {licenseInfo.cardExpiry}</p>
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
            Purchase Additional Licenses
          </CardTitle>
          <CardDescription>
            {requiredLicenses 
              ? `You need at least ${requiredLicenses} more license(s) to proceed`
              : 'Add more user licenses to your subscription'}
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
                onClick={() => setAdditionalLicenses(Math.max(2, additionalLicenses - 1))}
                disabled={additionalLicenses <= 2}
              >
                -
              </Button>
              <Input
                type="number"
                min="2"
                value={additionalLicenses}
                onChange={(e) => setAdditionalLicenses(Math.max(2, parseInt(e.target.value) || 2))}
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
                  <p className="text-2xl font-bold">$6</p>
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
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-green-600 text-white">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Save 20%
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">Yearly</p>
                      <p className="text-xs text-muted-foreground">Best value</p>
                    </div>
                    {selectedPlan === 'yearly' && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">$5<span className="text-base text-muted-foreground">/month</span></p>
                  <p className="text-xs text-muted-foreground">billed annually at $60/year</p>
                  <p className="text-xs text-green-600 font-medium mt-1">Save $12/year per license</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Save Card for Auto-Renewal */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Licenses</span>
              <span className="font-semibold">{additionalLicenses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price per license</span>
              <span className="font-semibold">
                ${pricePerUser}/{selectedPlan === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            {selectedPlan === 'yearly' && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm">Annual savings</span>
                <span className="font-semibold">-${additionalLicenses * 12}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Total</span>
              <div className="text-right">
                <span className="font-bold text-2xl" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}>
                  ${totalCost}
                </span>
                {selectedPlan === 'yearly' && (
                  <p className="text-xs text-muted-foreground">${monthlyEquivalent}/month</p>
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
                      {pollingStatus || 'Complete your payment in the Paystack tab. Once paid, your licenses will be activated automatically — just close the payment tab and come back here.'}
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
              disabled={loading || additionalLicenses < 1}
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
            <p className="mt-1 text-gray-400">
              Currency: set via <code className="bg-gray-100 px-1 rounded">PAYSTACK_CURRENCY</code> env var (default: GHS).
              If payment fails, set to <strong>NGN</strong> for Nigerian Paystack accounts or <strong>USD</strong> for international.
            </p>
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

      {/* User License Selector Dialog */}
      {showUserSelector && (
        <UserLicenseSelector
          open={showUserSelector}
          onOpenChange={setShowUserSelector}
          users={allUsers}
          maxLicenses={additionalLicenses}
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