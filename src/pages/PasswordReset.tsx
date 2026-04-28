import React, { useState, useEffect, startTransition, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api-client';
import { supabase } from '../lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { toast } from 'sonner';

const BLUMEBYTE_COLOR = '#000000';

function blumeGradientStyle() {
  return { background: 'linear-gradient(135deg, #000000, #1a1a1a)' };
}

export function PasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ?token — custom Resend-based reset token
  const token = searchParams.get('token');
  // ?code  — Supabase PKCE recovery code (sent when flowType='pkce')
  const code = searchParams.get('code');

  // Capture the initial URL hash for legacy implicit-flow recovery links
  // (e.g. #access_token=xxx&type=recovery).  useMemo runs synchronously
  // during the first render, before any async Supabase URL processing.
  const initialHash = useMemo(() => (typeof window !== 'undefined' ? window.location.hash : ''), []);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');
  // Whether we're using Supabase Auth recovery (from email link) vs custom token
  const [isSupabaseRecovery, setIsSupabaseRecovery] = useState(false);

  useEffect(() => {
    document.title = 'Reset Password - Blumebyte';

    // Whether we came via a PKCE code or a legacy hash — if either is present
    // we should NOT show the "invalid token" error immediately; instead we
    // wait for Supabase to finish the code-exchange and fire PASSWORD_RECOVERY.
    const hasPkceCode = !!code;
    const hasRecoveryHash = window.location.hash.includes('type=recovery') || initialHash.includes('type=recovery');
    const hasAccessToken = window.location.hash.includes('access_token') || initialHash.includes('access_token');

    // Timeout so the user is never stuck on the spinner indefinitely.
    let recoveryTimeout: ReturnType<typeof setTimeout> | null = null;

    // Listen for Supabase PASSWORD_RECOVERY event.
    // With flowType='pkce', Supabase exchanges ?code= for a session
    // asynchronously and fires this event when done.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        if (recoveryTimeout) clearTimeout(recoveryTimeout);
        setIsSupabaseRecovery(true);
        setTokenValid(true);
        setValidating(false);
      }
    });

    // Also check current session state — Supabase may have already finished
    // the code exchange by the time getSession() resolves.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && (hasRecoveryHash || hasPkceCode)) {
        // Session already established from this recovery flow.
        if (recoveryTimeout) clearTimeout(recoveryTimeout);
        setIsSupabaseRecovery(true);
        setTokenValid(true);
        setValidating(false);
      } else if (hasPkceCode || hasAccessToken) {
        // Supabase is still exchanging the code / processing the hash.
        // Stay in loading state and rely on the onAuthStateChange handler above.
        // Set a fallback timeout so the user isn't stuck forever.
        recoveryTimeout = setTimeout(() => {
          setError('Password reset timed out. Please check your connection or request a new reset link.');
          setValidating(false);
        }, 15000);
      } else if (token) {
        // Custom token-based reset (Resend fallback flow).
        const validateToken = async () => {
          try {
            const result = await api('/auth/validate-reset-token', {
              method: 'POST',
              body: JSON.stringify({ token }),
            });
            if (result.valid) {
              setTokenValid(true);
            } else {
              setError(result.error || 'This password reset link has expired or is invalid');
            }
          } catch (err) {
            setError('Failed to validate reset link. Please request a new one.');
          } finally {
            setValidating(false);
          }
        };
        validateToken();
      } else {
        // No code, no hash, no token — genuinely missing.
        setError('Invalid or missing reset token');
        setValidating(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (recoveryTimeout) clearTimeout(recoveryTimeout);
    };
  }, [token, code, initialHash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseRecovery) {
        // Use Supabase Auth to update the password (recovery session is active)
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
      } else {
        // Use the custom token-based API endpoint
        await api('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, newPassword: password }),
        });
      }
      
      setResetSuccess(true);
      toast.success('Password reset successfully!');
      
      setTimeout(() => {
        startTransition(() => {
          navigate('/login');
        });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={blumeGradientStyle()}>
        <Loader2 className="w-8 h-8 animate-spin text-white" />
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
            <h1 className="text-2xl font-bold">Reset Your Password</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>
          </CardHeader>
          <CardContent className="pt-4 pb-8 px-8">
            {!tokenValid && error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Invalid Reset Link</AlertTitle>
                <AlertDescription>
                  {error}
                  <div className="mt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        startTransition(() => {
                          navigate('/login');
                        });
                      }}
                      className="w-full text-white"
                      style={{ backgroundColor: BLUMEBYTE_COLOR }}
                    >
                      Return to Login
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : resetSuccess ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">Password Reset Successful!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your password has been reset successfully. Redirecting to login...
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full text-white"
                  style={{ backgroundColor: BLUMEBYTE_COLOR }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        navigate('/login');
                      });
                    }}
                    className="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PasswordReset;

