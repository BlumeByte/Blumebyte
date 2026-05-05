import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle, Smartphone, Mail } from 'lucide-react';
import { TwoFactorSetup } from './TwoFactorSetup';
import { toast } from 'sonner@2.0.3';

export function TwoFactorSettings() {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    requires2FA: boolean;
    twoFactorEnabled: boolean;
    twoFactorVerifiedAt: string | null;
    totpEnabled: boolean;
  } | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  // Email OTP setup state
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailSetupLoading, setEmailSetupLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const data = await api(`/auth/2fa/status?email=${encodeURIComponent(user.email)}`);
      setStatus(data);
    } catch (error: any) {
      console.error('Failed to fetch 2FA status:', error);
      toast.error('Failed to load 2FA settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    fetchStatus();
    toast.success('Authenticator app 2FA enabled successfully!');
  };

  const handleSendEmailCode = async () => {
    if (!user?.email) return;
    setEmailSetupLoading(true);
    try {
      await api('/auth/2fa/send-code', { method: 'POST', body: { email: user.email } });
      setEmailCodeSent(true);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send code');
    } finally {
      setEmailSetupLoading(false);
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setEmailSetupLoading(true);
    try {
      await api('/auth/2fa/verify-code', { method: 'POST', body: { email: user.email, code: emailCode } });
      setShowEmailSetup(false);
      setEmailCodeSent(false);
      setEmailCode('');
      fetchStatus();
      toast.success('Email 2FA enabled successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code. Please try again.');
    } finally {
      setEmailSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Enhance your account security with 2FA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showSetup && user?.email) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowSetup(false)}
          className="mb-2"
        >
          ← Back to Settings
        </Button>
        <TwoFactorSetup 
          email={user.email} 
          onComplete={handleSetupComplete}
        />
      </div>
    );
  }

  const isTotp = status?.totpEnabled;
  const isEmailOtp = status?.twoFactorEnabled;
  const isEnabled = isTotp || isEmailOtp;
  const enabledAt = status?.twoFactorVerifiedAt;

  // Email OTP setup flow
  if (showEmailSetup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enable Email 2FA
          </CardTitle>
          <CardDescription>Receive a one-time code by email each time you log in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailCodeSent ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                A 6-digit verification code will be sent to <strong>{user?.email}</strong> to confirm setup.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleSendEmailCode} disabled={emailSetupLoading} className="flex-1">
                  {emailSetupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send Verification Code
                </Button>
                <Button variant="outline" onClick={() => setShowEmailSetup(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyEmailCode} className="space-y-4">
              <p className="text-sm text-gray-600">Enter the code sent to <strong>{user?.email}</strong></p>
              <div className="space-y-2">
                <Label htmlFor="email-2fa-code">Verification Code</Label>
                <Input
                  id="email-2fa-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={emailSetupLoading || emailCode.length !== 6} className="flex-1">
                  {emailSetupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify &amp; Enable
                </Button>
                <Button type="button" variant="outline" onClick={handleSendEmailCode} disabled={emailSetupLoading}>Resend</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowEmailSetup(false); setEmailCodeSent(false); setEmailCode(''); }}>Cancel</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication (2FA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex-shrink-0 mt-0.5">
            {isEnabled ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {isEnabled ? '2FA Enabled' : '2FA Not Enabled'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isTotp
                ? 'Your account is protected with an authenticator app.'
                : isEmailOtp
                ? 'Your account is protected — you receive a code by email when you log in.'
                : 'Enable 2FA to add an extra layer of security to your account.'}
            </p>
            {enabledAt && (
              <p className="text-xs text-gray-500 mt-2">
                Enabled on: {new Date(enabledAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* SuperAdmin Requirement Notice */}
        {status?.requires2FA && !isEnabled && (
          <Alert className="border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <p className="font-semibold mb-1">2FA Required for SuperAdmin</p>
              <p className="text-sm">
                As a SuperAdmin, you have access to sensitive company data and settings. 
                Two-factor authentication is strongly recommended for your account security.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* How it works */}
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">How 2FA Works:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>When you log in, you'll be asked for a second verification code</li>
            <li><strong>Email OTP:</strong> a one-time code is sent to your registered email address</li>
            <li><strong>Authenticator app:</strong> scan a QR code with Google Authenticator, Authy, etc.</li>
            <li>Protects against unauthorised access even if your password is compromised</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {!isEmailOtp && (
            <Button
              variant={isTotp ? 'outline' : 'default'}
              onClick={() => setShowEmailSetup(true)}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isEmailOtp ? 'Re-verify Email 2FA' : 'Enable Email 2FA (receive code by email)'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowSetup(true)}
            className="w-full"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            {isTotp ? 'Re-link Authenticator App' : 'Enable Authenticator App 2FA (QR code)'}
          </Button>
          {isEmailOtp && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmailSetup(true)}
              className="w-full text-blue-600"
            >
              Re-verify Email 2FA
            </Button>
          )}
        </div>

        {/* Security Tips */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-900 dark:text-blue-300">
            <strong>💡 Security Tip:</strong> Always keep your email account secure with a strong, unique password
            and enable 2FA on your email provider as well.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
