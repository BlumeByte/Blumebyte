import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api-client';
import { toast } from 'sonner@2.0.3';

interface TwoFactorSetupProps {
  email: string;
  onComplete: () => void;
  onSkip?: () => void;
}

export function TwoFactorSetup({ email, onComplete, onSkip }: TwoFactorSetupProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const handleSendCode = async () => {
    setSendingCode(true);
    setError('');

    try {
      await api('/auth/2fa/send-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      toast.success('Verification code sent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      toast.error('Failed to send code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api('/auth/2fa/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });

      setSuccess(true);
      toast.success('Two-factor authentication enabled!');
      
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.message || 'Invalid verification code';
      setError(errorMsg);
      
      // Check if attempts remaining info is available
      if (err.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.attemptsRemaining);
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-send code on mount
  useEffect(() => {
    handleSendCode();
  }, []);

  if (success) {
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
            Your account is now protected with two-factor authentication.
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
            <CardDescription>Protect your account with an extra layer of security</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Check your email</p>
            <p className="text-blue-700">
              We've sent a 6-digit verification code to <strong>{email}</strong>
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <p className="mt-1 text-sm">
                  {attemptsRemaining} {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
              }}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Verify & Enable 2FA
                </>
              )}
            </Button>
          </div>

          {/* Resend Code */}
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSendCode}
              disabled={sendingCode}
            >
              {sendingCode ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Didn't receive the code? Resend"
              )}
            </Button>
          </div>

          {/* Skip Option (if provided) */}
          {onSkip && (
            <div className="text-center pt-2 border-t">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={onSkip}
                className="text-gray-500"
              >
                Skip for now
              </Button>
            </div>
          )}
        </form>

        {/* Info Box */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>Why enable 2FA?</strong> Two-factor authentication adds an extra layer of security
            to your SuperAdmin account, protecting sensitive company data and employee information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
