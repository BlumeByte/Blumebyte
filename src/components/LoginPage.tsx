import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api-client';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const BLUMEBYTE_COLOR = '#1d4ed8';

function blumeGradientStyle() {
  return { background: `linear-gradient(135deg, ${BLUMEBYTE_COLOR}, #1e3a8a)` };
}

export function LoginPage() {
  const { user, sessionLoading, loginLoading, loginError, login, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // License checking temporarily deactivated
  /*
  const [licenseStatus, setLicenseStatus] = useState<{ hasLicenses: boolean; loading: boolean }>({
    hasLicenses: true,
    loading: true,
  });
  */

  useEffect(() => {
    if (!sessionLoading && user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, sessionLoading, navigate]);

  // License checking temporarily deactivated
  /*
  // Check license status on page load
  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      // Make a public check to see if system has licenses
      const data = await api('/subscription/public-license-check');
      setLicenseStatus({
        hasLicenses: data.hasLicenses || false,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking license status:', error);
      // If error, assume licenses might exist (don't block login on check error)
      setLicenseStatus({
        hasLicenses: true,
        loading: false,
      });
    }
  };
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
    } catch (_) {}
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={blumeGradientStyle()}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={blumeGradientStyle()}>
      <div className="w-full max-w-md">
        {/* License Warning Alert - temporarily deactivated */}
        {/*
        {!licenseStatus.loading && !licenseStatus.hasLicenses && (
          <Alert variant="destructive" className="mb-4 border-2 animate-pulse bg-red-50">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">⚠️ System Access Limited</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p className="font-semibold text-red-900">
                  This organization has not purchased user licenses yet.
                </p>
                <p className="text-sm text-red-800">
                  Please contact your <strong>SuperAdmin</strong> to purchase licenses and activate the system.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )
        */}

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: BLUMEBYTE_COLOR + '20' }}>
              <span className="text-3xl font-bold" style={{ color: BLUMEBYTE_COLOR }}>S</span>
            </div>
            <h1 className="text-2xl tracking-tight text-gray-900" style={{ fontWeight: 700 }}>SAS FINANCE GROUP</h1>
            <p className="text-sm text-gray-500 mt-1">Human Resource Information System</p>
          </CardHeader>
          <CardContent className="pt-4 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full text-white" style={{ backgroundColor: BLUMEBYTE_COLOR }} disabled={loginLoading}>
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-6">
              Don't have an account? Contact your administrator.
            </p>
          </CardContent>
        </Card>
        {/* Footer temporarily hidden */}
        {/*
        <div className="text-center mt-4 space-y-2">
          <p className="text-xs text-blue-200">
            &copy; {new Date().getFullYear()} Blumebyte HRIS. All rights reserved.
          </p>
          <p className="text-xs text-blue-200">
            Visit{' '}
            <a
              href="https://www.blumebyte.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-100 transition-colors font-medium"
            >
              www.blumebyte.com
            </a>
            {' '}for more products and services
          </p>
        </div>
        */}
      </div>
    </div>
  );
}

export default LoginPage;