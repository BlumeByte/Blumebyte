import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, CheckCircle, AlertCircle, Loader2, Copy, Smartphone } from 'lucide-react';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { toast } from 'sonner@2.0.3';

interface TwoFactorSetupProps {
  email: string;
  onComplete: () => void;
  onSkip?: () => void;
}

export function TwoFactorSetup({ email, onComplete, onSkip }: TwoFactorSetupProps) {
  const { accessToken } = useAuth();
  const [step, setStep] = useState<'qr' | 'verify' | 'done'>('qr');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');

  useEffect(() => {
    loadSetup();
  }, []);

  const loadSetup = async () => {
    setLoadingSetup(true);
    setError('');
    try {
      const response = await api('/auth/totp/setup', {
        method: 'POST',
        token: accessToken,
        body: {},
      });
      setSecret(response.secret);
      // Generate QR code client-side — secret never leaves the browser
      const dataUrl = await QRCode.toDataURL(response.totpUri, { width: 200, margin: 1 });
      setQrDataUrl(dataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code. Please try again.');
    } finally {
      setLoadingSetup(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/auth/totp/verify-setup', {
        method: 'POST',
        token: accessToken,
        body: { code },
      });
      setStep('done');
      toast.success('Authenticator app 2FA enabled!');
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      toast.error(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret).then(() => {
      toast.success('Secret copied to clipboard');
    }).catch(() => {
      toast.error('Could not copy to clipboard. Please copy it manually.');
    });
  };

  if (step === 'done') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">2FA Enabled Successfully!</h3>
          <p className="text-gray-600">
            Your account is now protected with an authenticator app.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-full bg-blue-100 p-2">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle>Enable Two-Factor Authentication</CardTitle>
            <CardDescription>Use an authenticator app for secure login codes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'qr' && (
          <>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Step 1: Scan QR Code</p>
                <p className="text-blue-700">
                  Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP
                  app and scan the QR code below.
                </p>
              </div>
            </div>

            {loadingSetup ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                <div className="flex justify-center py-2">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="TOTP QR Code"
                      className="w-48 h-48 rounded border border-gray-200"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-500 text-center">
                    Can't scan? Enter this secret manually:
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                    <span className="flex-1 select-all">{secret}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={copySecret} className="shrink-0 h-6 w-6 p-0">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setStep('verify')}>
                  I've scanned the QR code →
                </Button>
              </>
            )}

            {onSkip && (
              <div className="text-center">
                <Button type="button" variant="link" size="sm" onClick={onSkip} className="text-gray-500">
                  Skip for now
                </Button>
              </div>
            )}
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Step 2: Enter the 6-digit code</p>
                <p className="text-blue-700">
                  Open your authenticator app and enter the current 6-digit code shown for Blumebyte HR.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totp-code">Authenticator Code</Label>
                <Input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify &amp; Enable 2FA
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep('qr')}>
                  ← Back to QR code
                </Button>
              </div>
            </form>
          </>
        )}

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Why enable 2FA?</strong> Authenticator app codes are generated offline and change
            every 30 seconds, providing strong protection even if your password is compromised.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
