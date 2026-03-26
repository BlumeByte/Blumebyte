import React, { useEffect, useState, startTransition } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner@2.0.3';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'needs_company' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Get the session from the URL hash
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError(sessionError.message);
        setStatus('error');
        return;
      }

      if (!session) {
        setError('No session found. Please try logging in again.');
        setStatus('error');
        return;
      }

      const accessToken = session.access_token;
      const user = session.user;
      setUserEmail(user.email || '');
      setUserId(user.id);

      // Check if user profile exists in our system
      try {
        const profile = await api('/profile', { token: accessToken });
        
        if (profile && profile.id) {
          // User exists, redirect to their dashboard
          setStatus('success');
          setTimeout(() => {
            startTransition(() => {
              navigate(`/${profile.role}`, { replace: true });
            });
          }, 1500);
        }
      } catch (err: any) {
        // User doesn't exist in our system yet
        if (err.message?.includes('not found') || err.status === 404) {
          // New OAuth user - need to create company profile
          setStatus('needs_company');
        } else {
          console.error('Profile check error:', err);
          setError(err.message || 'Failed to verify user profile');
          setStatus('error');
        }
      }
    } catch (err: any) {
      console.error('OAuth callback error:', err);
      setError(err.message || 'An unexpected error occurred');
      setStatus('error');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setCreating(true);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Session expired. Please try logging in again.');
      }

      const userName = session.user.user_metadata?.full_name || 
                       session.user.user_metadata?.name || 
                       session.user.email?.split('@')[0] || 
                       'User';

      // Create company and SuperAdmin profile via backend
      const response = await fetch(
        `https://${await import('../utils/supabase/info').then(m => m.projectId)}.supabase.co/functions/v1/make-server-668731fc/oauth/create-company`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            companyName: companyName.trim(),
            userName,
            email: session.user.email,
            userId: session.user.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create company' }));
        throw new Error(errorData.error || 'Failed to create company');
      }

      const data = await response.json();
      
      toast.success('Company created successfully!', {
        description: 'Redirecting to your dashboard...',
      });

      setStatus('success');
      
      // Redirect to SuperAdmin dashboard
      setTimeout(() => {
        startTransition(() => {
          navigate('/superadmin', { replace: true });
        });
      }, 1500);

    } catch (err: any) {
      console.error('Company creation error:', err);
      toast.error('Failed to create company', {
        description: err.message,
      });
    } finally {
      setCreating(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <CardTitle>Completing Sign In</CardTitle>
            <CardDescription>Please wait while we verify your account...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'needs_company') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Welcome to Blumebyte!</CardTitle>
            <CardDescription>
              We need a few more details to set up your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>New Account Detected</AlertTitle>
              <AlertDescription>
                Signed in as: <strong>{userEmail}</strong>
                <br />
                Please create your company to continue.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={creating}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={creating || !companyName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Company...
                  </>
                ) : (
                  'Create Company & Continue'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You will be set up as the SuperAdmin for your company
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Sign In Successful!</CardTitle>
            <CardDescription>Redirecting you to your dashboard...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Authentication Failed</CardTitle>
            <CardDescription>There was a problem signing you in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || 'Unknown error occurred'}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => {
                startTransition(() => {
                  navigate('/login');
                });
              }}
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}