import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, Loader2, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api-client';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { OAuthButtons } from './OAuthButtons';
import { toast } from 'sonner';

const BLUMEBYTE_COLOR = '#000000';

function blumeGradientStyle() {
  return { background: 'linear-gradient(135deg, #000000, #1a1a1a)' };
}

export function LoginPage() {
  const { user, sessionLoading, loginLoading, loginError, login, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetSuccess(true);
    } catch (error) {
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
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
            <div className="flex justify-center mb-4">
              <img src={logoImage} alt="Blumebyte" className="h-12" />
            </div>
            <p className="text-sm text-gray-500 mt-1">Sign in to your company account</p>
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
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordOpen(true);
                      setResetEmail(email);
                      setResetSuccess(false);
                    }}
                    className="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full text-white" style={{ backgroundColor: BLUMEBYTE_COLOR }} disabled={loginLoading}>
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <OAuthButtons mode="login" disabled={loginLoading} />
            
            <p className="text-center text-xs text-gray-400 mt-6">
              New to Blumebyte?{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-black hover:underline font-medium"
              >
                Create a company account
              </button>
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

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your email to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          
          {resetSuccess ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">Password Reset Link Sent</AlertTitle>
              <AlertDescription className="text-green-700">
                We have sent a password reset link to your email. Please check your inbox.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="you@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotPasswordOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-white" style={{ backgroundColor: BLUMEBYTE_COLOR }} disabled={resetLoading}>
                  {resetLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Reset Link
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LoginPage;