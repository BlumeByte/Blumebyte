import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api-client.tsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Loader2, CheckCircle, XCircle, Users, Zap, CreditCard, X } from 'lucide-react';
import { useBranding, brandGradientStyle } from '../lib/branding-context';
import { toast } from 'sonner@2.0.3';

export function LicensePaymentVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [closeCountdown, setCloseCountdown] = useState<number | null>(null);

  // Guard against multiple verification attempts (accessToken changes multiple times
  // due to INITIAL_SESSION + TOKEN_REFRESHED events in auth context)
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (!accessToken) return;           // wait for token
    if (hasVerifiedRef.current) return; // already attempted
    hasVerifiedRef.current = true;
    verifyPayment(accessToken);
  }, [accessToken]);

  // Auto-close countdown when sync is done
  useEffect(() => {
    if (!syncDone) return;
    
    let count = 5;
    setCloseCountdown(count);
    
    const timer = setInterval(() => {
      count--;
      setCloseCountdown(count);
      
      if (count <= 0) {
        clearInterval(timer);
        // Try to close the tab (only works if opened by script)
        try {
          window.close();
        } catch {
          // If we can't close, navigate to dashboard
        }
        // Fallback: navigate to dashboard if close didn't work
        setTimeout(() => {
          navigate('/superadmin', { replace: true });
        }, 500);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [syncDone, navigate]);

  const verifyPayment = async (token: string) => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found in the URL. Please try again or contact support.');
      return;
    }

    try {

      const response = await apiClient.post('/subscription/verify-license', { reference }, token);


      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setLicenseInfo(data);
          const licensesText = data.licensesAdded === 1 ? 'license' : 'licenses';
          setMessage(`Success! ${data.licensesAdded} ${licensesText} added to your account.`);
          toast.success(`Payment successful! ${data.licensesAdded} ${licensesText} purchased.`, { duration: 5000 });
          
          // Auto-sync licenses immediately after successful verification
          autoSyncLicenses(token);
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment verification failed. Please contact support.');
          toast.error(data.message || 'Payment verification failed');
        }
      } else {
        const error = await response.json();
        console.error('Verification failed:', error);
        // Show Paystack transaction status if available for easier debugging
        const detail = error.paystackStatus ? ` (Paystack status: ${error.paystackStatus})` : '';
        const msg = (error.message || 'Failed to verify payment. Please contact support.') + detail;
        setStatus('failed');
        setMessage(msg);
        toast.error(msg);
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage('A network error occurred while verifying your payment. Please check your connection and try again.');
      toast.error('Network error during payment verification');
    }
  };

  // Auto-sync licenses after successful payment
  const autoSyncLicenses = async (token: string) => {
    try {
      setSyncing(true);

      const response = await apiClient.post('/sync-user-licenses', {}, token);

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `Licenses synced! Activated: ${result.activatedCount}, Deactivated: ${result.deactivatedCount}`,
          { duration: 5000 }
        );
      } else {
        const error = await response.json();
        console.error('Auto-sync failed:', error);
      }
    } catch (error: any) {
      console.error('Error auto-syncing licenses:', error);
    } finally {
      setSyncing(false);
      setSyncDone(true);
    }
  };

  // Allow manual retry without full page reload
  const handleManualRetry = () => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) {
      toast.error('No payment reference in URL. Please contact support.');
      return;
    }
    if (!accessToken) {
      toast.error('Not authenticated. Please log in again.');
      navigate('/login', { replace: true });
      return;
    }
    setStatus('verifying');
    setMessage('Verifying your payment...');
    hasVerifiedRef.current = true; // keep guard set so dep-effect won't re-fire
    verifyPayment(accessToken);
  };

  const handleManualSync = async () => {
    if (!accessToken) return;
    autoSyncLicenses(accessToken);
  };

  const handleRetry = () => {
    navigate('/superadmin', { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate('/superadmin', { replace: true });
  };

  const handleCloseTab = () => {
    try {
      window.close();
    } catch {
      // If close fails, navigate to dashboard
      navigate('/superadmin', { replace: true });
    }
    // Fallback if close didn't work
    setTimeout(() => {
      navigate('/superadmin', { replace: true });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">License Payment Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            {status === 'verifying' && (
              <>
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={brandGradientStyle(branding?.primaryColor || '#1d4ed8')}>
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
                <div>
                  <p className="font-semibold mb-2">{message}</p>
                  <p className="text-sm text-muted-foreground">Please wait...</p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-600 text-xl mb-2">Payment Successful!</p>
                  <p className="text-sm text-muted-foreground mb-4">{message}</p>
                  {licenseInfo && (
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg space-y-3 text-sm border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Licenses Added:</span>
                        <span className="font-bold text-green-600 flex items-center gap-1 text-lg">
                          <Users className="w-5 h-5" />
                          {licenseInfo.licensesAdded}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Licenses:</span>
                        <span className="font-semibold">{licenseInfo.totalLicenses}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Plan:</span>
                        <span className="font-semibold capitalize">{licenseInfo.plan}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Amount Paid:</span>
                        <span className="font-semibold flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          ${licenseInfo.amountPaid}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sync status */}
                  {syncing && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-700 font-medium">Syncing user licenses...</span>
                      </div>
                    </div>
                  )}

                  {/* Close tab prompt */}
                  {syncDone && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-800 font-semibold">
                            Licenses activated! You can close this tab now.
                          </span>
                        </div>
                        <p className="text-xs text-green-600">
                          {closeCountdown !== null && closeCountdown > 0
                            ? `This tab will close automatically in ${closeCountdown}s...`
                            : 'Closing...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleCloseTab}
                    style={brandGradientStyle(branding?.primaryColor || '#1d4ed8')}
                    className="text-white w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close This Tab
                  </Button>

                  {!syncDone && !syncing && (
                    <Button
                      onClick={handleManualSync}
                      disabled={syncing}
                      variant="outline"
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Sync User Licenses & Activate Users
                    </Button>
                  )}

                  <Button onClick={handleGoToDashboard} variant="ghost" className="w-full text-sm">
                    Go to Dashboard
                  </Button>
                </div>
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-600 mb-2">Verification Failed</p>
                  <p className="text-sm text-muted-foreground">{message}</p>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                    <p className="font-semibold text-yellow-900 mb-2">What to do:</p>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                      <li>If payment was deducted, click "Retry Verification" below</li>
                      <li>Wait 30 seconds for Paystack to process, then retry</li>
                      <li>Contact your bank if the charge appeared</li>
                      <li>Reach out to support if issue persists</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button onClick={handleManualRetry} className="w-full" style={brandGradientStyle(branding?.primaryColor || '#1d4ed8')}>
                    <Loader2 className="w-4 h-4 mr-2" />
                    <span className="text-white">Retry Verification</span>
                  </Button>
                  <Button onClick={handleCloseTab} variant="outline" className="w-full">
                    <X className="w-4 h-4 mr-2" />
                    Close This Tab
                  </Button>
                  <Button onClick={handleRetry} variant="ghost" className="w-full text-sm">
                    Return to Dashboard
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LicensePaymentVerification;