import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Building2, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import logoImage from '@/assets/logo';

export default function OAuthConsent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const provider = searchParams.get('provider') || 'OAuth Provider';
  const email = searchParams.get('email');
  const scopes = searchParams.get('scopes')?.split(',') || ['email', 'profile'];

  const handleAuthorize = () => {
    setLoading(true);
    // This consent page is informational only
    // The actual OAuth flow is handled by Supabase
    // Redirect back to login to initiate OAuth
    navigate('/login');
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Blumebyte" className="h-12" />
          </div>
          <CardTitle className="text-2xl">Authorization Request</CardTitle>
          <CardDescription>
            {provider} wants to access your Blumebyte account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Permission Request</AlertTitle>
            <AlertDescription>
              This will allow {provider} to access the following information:
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Basic Profile Information</p>
                <p className="text-xs text-gray-600">Your name and profile photo</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Email Address</p>
                <p className="text-xs text-gray-600">Your primary email address</p>
              </div>
            </div>

            {email && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Building2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Account Linking</p>
                  <p className="text-xs text-gray-600">
                    This will be linked to: <strong>{email}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Important</AlertTitle>
            <AlertDescription className="text-amber-800">
              You'll be redirected to {provider} to complete authentication. 
              Make sure you trust this provider.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleAuthorize} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                'Authorize & Continue'
              )}
            </Button>
            
            <Button 
              onClick={handleCancel} 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By authorizing, you agree to Blumebyte's{' '}
              <a href="/terms-conditions" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
