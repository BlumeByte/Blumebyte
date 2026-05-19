import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useBranding, brandGradientStyle } from '../lib/branding-context';

export function PaymentVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const { branding } = useBranding();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (!accessToken) return;
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;
    verifyPayment();
  }, [accessToken]);

  const verifyPayment = async () => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    
    const paymentReference = reference || trxref;

    if (!paymentReference) {
      setStatus('failed');
      setMessage('No payment reference found. Please try again.');
      return;
    }
    
    if (!accessToken) {
      // Wait for token
      return;
    }

    try {
      const response = await api('/subscription/verify', {
        method: 'POST',
        token: accessToken,
        body: { reference: paymentReference },
      });

      if (response.success) {
        setStatus('success');
        setMessage(`Payment successful! Your ${response.plan} subscription is now active.`);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate(`/${user?.role}`, { replace: true });
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(response.message || 'Payment verification failed. Please contact support.');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage(error.message || 'An error occurred while verifying your payment. Please contact support.');
    }
  };

  const handleRetry = () => {
    navigate('/subscription', { replace: true });
  };

  const handleGoToDashboard = () => {
    navigate(`/${user?.role}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Payment Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            {status === 'verifying' && (
              <>
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={brandGradientStyle}>
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
                  <p className="font-semibold text-green-600 mb-2">Success!</p>
                  <p className="text-sm text-muted-foreground">{message}</p>
                  <p className="text-xs text-muted-foreground mt-2">Redirecting to your dashboard...</p>
                </div>
                <Button onClick={handleGoToDashboard} style={brandGradientStyle} className="text-white w-full">
                  Go to Dashboard
                </Button>
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-600 mb-2">Payment Failed</p>
                  <p className="text-sm text-muted-foreground">{message}</p>
                </div>
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  Try Again
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentVerification;
