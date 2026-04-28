import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Building2, Shield, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { supabase } from '../lib/supabase';
import { projectId } from '../utils/supabase/info';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`;

// Human-readable labels for common OAuth scopes
const SCOPE_LABELS: Record<string, { title: string; description: string }> = {
  openid: { title: 'OpenID Identity', description: 'Verify your identity via OpenID Connect' },
  email: { title: 'Email Address', description: 'Your primary email address' },
  profile: { title: 'Basic Profile', description: 'Your name and profile photo' },
  phone: { title: 'Phone Number', description: 'Your registered phone number' },
  offline_access: { title: 'Offline Access', description: 'Access your data when you are not actively using the app' },
};

export default function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Standard OAuth 2.0 / OIDC parameters forwarded by Supabase
  const clientId     = searchParams.get('client_id') ?? '';
  const redirectUri  = searchParams.get('redirect_uri') ?? '';
  const scope        = searchParams.get('scope') ?? 'openid email profile';
  const state        = searchParams.get('state') ?? '';
  const responseType = searchParams.get('response_type') ?? 'code';
  const nonce        = searchParams.get('nonce') ?? '';
  const codeChallenge       = searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? '';

  const scopes = scope.split(/[\s,]+/).filter(Boolean);

  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');

  // Guard: must have required OAuth params
  const missingParams = !clientId || !redirectUri || !responseType;

  useEffect(() => {
    document.title = 'Authorize Application - Blumebyte';

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({ email: user.email, id: user.id });
      } else {
        // Not authenticated — redirect to login, then come back
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?return_to=${returnTo}`);
      }
      setSessionLoading(false);
    });
  }, [navigate]);

  const handleAuthorize = async () => {
    setApproving(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?return_to=${returnTo}`);
        return;
      }

      // Build the authorize request body to POST to Supabase
      const body = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope,
        ...(state && { state }),
        ...(nonce && { nonce }),
        ...(codeChallenge && { code_challenge: codeChallenge }),
        ...(codeChallengeMethod && { code_challenge_method: codeChallengeMethod }),
      });

      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/oauth2/authorize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: body.toString(),
          redirect: 'manual', // We'll handle the redirect ourselves
        }
      );

      // Supabase returns 302 with Location pointing to redirect_uri?code=xxx&state=xxx
      const location = response.headers.get('Location') || response.url;
      if (location && location !== window.location.href) {
        window.location.href = location;
        return;
      }

      if (!response.ok && response.status !== 302 && response.status !== 0) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Authorization failed (HTTP ${response.status})`);
      }

      // Fallback: if redirect wasn't caught (some browsers follow redirect_uri
      // before returning), we're already navigated away. If somehow we're still here:
      window.location.href = redirectUri + (redirectUri.includes('?') ? '&' : '?')
        + `error=server_error&error_description=Unexpected+response`
        + (state ? `&state=${encodeURIComponent(state)}` : '');
    } catch (err: any) {
      setError(err.message || 'Authorization failed. Please try again.');
      setApproving(false);
    }
  };

  const handleDeny = () => {
    if (!redirectUri) {
      navigate('/login');
      return;
    }
    const sep = redirectUri.includes('?') ? '&' : '?';
    const deniedUrl = redirectUri
      + sep
      + 'error=access_denied&error_description=The+user+denied+access'
      + (state ? `&state=${encodeURIComponent(state)}` : '');
    window.location.href = deniedUrl;
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (missingParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Authorization Request</AlertTitle>
              <AlertDescription>
                This authorization link is missing required parameters.
                Please contact the application that sent you here.
              </AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => navigate('/login')}>
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Blumebyte" className="h-12" />
          </div>
          <CardTitle className="text-2xl">Authorization Request</CardTitle>
          <CardDescription>
            An application is requesting access to your Blumebyte account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Signed-in user */}
          {user?.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Permission Request</AlertTitle>
            <AlertDescription>
              This application (<code className="text-xs bg-gray-100 px-1 rounded">{clientId}</code>) is requesting:
            </AlertDescription>
          </Alert>

          {/* Scope list */}
          <div className="space-y-2">
            {scopes.map((s) => {
              const label = SCOPE_LABELS[s];
              return (
                <div key={s} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{label?.title ?? s}</p>
                    {label && (
                      <p className="text-xs text-gray-600">{label.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Redirect notice */}
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Building2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Redirect destination</p>
              <p className="text-xs text-gray-600 break-all">{redirectUri}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authorization Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleAuthorize}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={approving}
            >
              {approving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authorizing…
                </>
              ) : (
                'Allow Access'
              )}
            </Button>

            <Button
              onClick={handleDeny}
              variant="outline"
              className="w-full"
              disabled={approving}
            >
              Deny
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            By authorizing, you agree to Blumebyte's{' '}
            <a href="/terms-conditions" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

