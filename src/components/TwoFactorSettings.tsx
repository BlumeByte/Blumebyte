import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle, Smartphone } from 'lucide-react';
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

  const isEnabled = status?.totpEnabled || status?.twoFactorEnabled;

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
        <div className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
          <div className="flex-shrink-0 mt-0.5">
            {isEnabled ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">
              {isEnabled ? '2FA Enabled' : '2FA Not Enabled'}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {isEnabled
                ? 'Your account is protected with an authenticator app.'
                : 'Enable 2FA to secure your account with an authenticator app.'}
            </p>
            {status?.twoFactorVerifiedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Enabled on: {new Date(status.twoFactorVerifiedAt).toLocaleString()}
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

        {/* Information */}
        <div className="space-y-2 text-sm text-gray-600">
          <h4 className="font-semibold text-gray-900">How 2FA Works:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
            <li>Scan the QR code to link Blumebyte HR to your app</li>
            <li>After logging in with your password, enter the 6-digit code from the app</li>
            <li>Codes refresh every 30 seconds and work offline</li>
            <li>Protects against unauthorised access even if your password is compromised</li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isEnabled ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSetup(true)}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Re-link Authenticator App
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowSetup(true)}
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              Enable Two-Factor Authentication
            </Button>
          )}
        </div>

        {/* Security Tips */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>💡 Security Tip:</strong> Store your authenticator app recovery codes safely.
            Recommended apps: Google Authenticator, Authy, Microsoft Authenticator, or 1Password.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
