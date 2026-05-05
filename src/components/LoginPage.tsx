import React, { useState, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
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
  const [logoutReason, setLogoutReason] = useState<string | null>(null);

  // TOTP verification state
  const [totpRequired, setTotpRequired] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  // Whether the pending 2FA is email-OTP (true) or TOTP authenticator app (false)
  const [is2FAEmail, setIs2FAEmail] = useState(false);

  useEffect(() => {
    // Check for logout reason in URL
    const params = new URLSearchParams(window.location.search);
    const reason = params.get('reason');
    if (reason) {
      if (reason === 'inactivity') {
        setLogoutReason('You were logged out due to inactivity. Please log in again.');
      } else if (reason === 'session_expired') {
        setLogoutReason('Your session expired. Please log in again.');
      }
      // Clear the URL parameter
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && user && !totpRequired) {
      startTransition(() => {
        const destination = user.role === 'ultimateadmin' ? '/customer-care' : `/${user.role}`;
        navigate(destination, { replace: true });
      });
    }
  }, [user, sessionLoading, navigate, totpRequired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      // Check 2FA status BEFORE calling login so we can intercept if needed
      let needsTotp = false;
      let needsEmailOtp = false;
      try {
        const statusData = await api(`/auth/2fa/status?email=${encodeURIComponent(email)}`);
        needsTotp = statusData?.totpEnabled === true;
        // Email OTP: enabled but no TOTP configured → use email flow
        needsEmailOtp = !needsTotp && statusData?.twoFactorEnabled === true;
      } catch {
        // If status check fails, proceed without 2FA
      }

      if (needsTotp || needsEmailOtp) {
        const submittedPassword = password;
        setPendingEmail(email);
        setPendingPassword(submittedPassword);
        setPassword('');
        setIs2FAEmail(needsEmailOtp);
        setTotpRequired(true);
        // For email OTP, send the code immediately
        if (needsEmailOtp) {
          try {
            await api('/auth/2fa/send-code', { method: 'POST', body: { email } });
            toast.success('Verification code sent to your email');
          } catch (sendErr: any) {
            // If email delivery is not configured or temporarily unavailable,
            // allow the user to sign in normally rather than leaving them locked out.
            if (sendErr?.status === 503 || sendErr?.error === 'email_delivery_failed' || (sendErr?.message || '').includes('email_delivery_failed') || (sendErr?.message || '').includes('not configured')) {
              toast.error('2FA email could not be sent (email service unavailable). Signing in without 2FA.');
              setTotpRequired(false);
              setPendingEmail('');
              setPendingPassword('');
              await login(email, submittedPassword);
              return;
            }
            toast.error('Failed to send verification code. Please try again.');
            setTotpRequired(false);
            setPendingEmail('');
            setPendingPassword('');
            return;
          }
        }
        return;
      }

      // No 2FA — sign in normally
      await login(email, password);
    } catch (_) {}
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpLoading(true);
    setTotpError('');
    try {
      if (is2FAEmail) {
        // Email OTP verification
        await api('/auth/2fa/verify-code', {
          method: 'POST',
          body: { email: pendingEmail, code: totpCode },
        });
      } else {
        // TOTP authenticator app verification
        await api('/auth/totp/verify-login', {
          method: 'POST',
          body: { email: pendingEmail, code: totpCode },
        });
      }
      // Code is valid — complete the password login
      const savedPassword = pendingPassword;
      setTotpRequired(false);
      setPendingPassword('');
      await login(pendingEmail, savedPassword);
    } catch (err: any) {
      setTotpError(err.message || 'Invalid code. Please try again.');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleResendEmailCode = async () => {
    try {
      await api('/auth/2fa/send-code', { method: 'POST', body: { email: pendingEmail } });
      toast.success('New verification code sent to your email');
    } catch {
      toast.error('Failed to resend code. Please try again.');
    }
  };

  const handleEmailOtpBypassLogin = async () => {
    if (!pendingEmail || !pendingPassword) {
      toast.error('Please return to login and try again.');
      return;
    }
    setTotpLoading(true);
    setTotpError('');
    try {
      const savedEmail = pendingEmail;
      const savedPassword = pendingPassword;
      setTotpRequired(false);
      setTotpCode('');
      setPendingEmail('');
      setPendingPassword('');
      setIs2FAEmail(false);
      await login(savedEmail, savedPassword);
      toast.success('Signed in without email code.');
    } catch (err: any) {
      setTotpRequired(true);
      setIs2FAEmail(true);
      setTotpError(err?.message || 'Could not sign in without code. Please try again.');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      // Use Supabase Auth's built-in reset email (uses project's configured email provider)
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/password-reset`,
      });
      if (error) {
        // Fall back to custom server endpoint if Supabase auth fails
        await api('/auth/forgot-password', {
          method: 'POST',
          body: { email: resetEmail },
        });
      }
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

  // 2FA verification screen (handles both email OTP and TOTP authenticator)
  if (totpRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={blumeGradientStyle()}>
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex justify-center mb-4">
                <img src={logoImage} alt="Blumebyte" className="h-12" />
              </div>
              <div className="flex justify-center mb-2">
                <div className="rounded-full bg-blue-100 p-3">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <p className="font-semibold text-gray-900 mt-1">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">
                {is2FAEmail
                  ? `Enter the 6-digit code sent to ${pendingEmail}`
                  : 'Open your authenticator app and enter the 6-digit code for Blumebyte HR.'}
              </p>
            </CardHeader>
            <CardContent className="pt-4 pb-8 px-8">
              <form onSubmit={handleTotpSubmit} className="space-y-4">
                {totpError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{totpError}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="totp-code">{is2FAEmail ? 'Email Verification Code' : 'Authenticator Code'}</Label>
                  <Input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest"
                    disabled={totpLoading}
                    autoFocus
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full text-white"
                  style={{ backgroundColor: BLUMEBYTE_COLOR }}
                  disabled={totpLoading || totpCode.length !== 6}
                >
                  {totpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Verify &amp; Sign In
                </Button>
                {is2FAEmail && (
                  <div className="space-y-2 text-center">
                    <button
                      type="button"
                      onClick={handleResendEmailCode}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Resend code
                    </button>
                    <div>
                      <button
                        type="button"
                        onClick={handleEmailOtpBypassLogin}
                        className="text-xs text-amber-700 hover:text-amber-900 transition-colors"
                        disabled={totpLoading}
                      >
                        Didn&apos;t receive email? Continue without code
                      </button>
                    </div>
                  </div>
                )}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setTotpRequired(false); setTotpCode(''); setTotpError(''); setPendingPassword(''); setPendingEmail(''); setIs2FAEmail(false); }}
                    className="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    ← Back to login
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={blumeGradientStyle()}>
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="flex justify-center mb-4">
              <img src={logoImage} alt="Blumebyte" className="h-12" />
            </div>
            <p className="text-sm text-gray-500 mt-1">Sign in to your company account</p>
          </CardHeader>
          <CardContent className="pt-4 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {logoutReason && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    {logoutReason}
                  </AlertDescription>
                </Alert>
              )}
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
                onClick={() => {
                  startTransition(() => {
                    navigate('/');
                  });
                }}
                className="text-black hover:underline font-medium"
              >
                Create a company account
              </button>
            </p>
          </CardContent>
        </Card>
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
              <AlertTitle className="text-green-800">Check Your Email</AlertTitle>
              <AlertDescription className="text-green-700">
                <div className="space-y-2">
                  <p>If an account with <strong>{resetEmail}</strong> exists, a password reset link has been sent to that address.</p>
                  <p className="text-xs text-green-600">⏰ The link will expire in 1 hour. Please also check your spam folder.</p>
                </div>
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
