import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertTriangle, Trash2, CheckCircle, XCircle, Database, Users, HardDrive } from 'lucide-react';

/**
 * Production Cleanup Utility
 * 
 * This page provides a UI to trigger the production cleanup endpoint
 * which deletes ALL test data and resets the system to production-ready state.
 * 
 * WARNING: This action is IRREVERSIBLE!
 */
export default function ProductionCleanup() {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [cleanupKey, setCleanupKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCleanup = async () => {
    if (confirmText !== 'DELETE ALL DATA') {
      setError('Please type "DELETE ALL DATA" to confirm');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const headers: Record<string, string> = {};
      if (cleanupKey.trim()) {
        headers['X-Cleanup-Key'] = cleanupKey.trim();
      }

      const response = await api('/production/cleanup', {
        method: 'POST',
        headers,
      });

      setResults(response);
      
      if (response.success) {
        // Clear local storage and redirect after 5 seconds
        setTimeout(() => {
          localStorage.clear();
          sessionStorage.clear();
          navigate('/', { replace: true });
          window.location.reload();
        }, 5000);
      }
    } catch (err: any) {
      console.error('Cleanup error:', err);
      setError(err.message || 'Failed to perform cleanup');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = confirmText === 'DELETE ALL DATA';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Production Cleanup Utility</h1>
          <p className="text-gray-600">
            Reset the Blumebyte SaaS platform to a clean production-ready state
          </p>
        </div>

        {/* Warning Alert */}
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">
            <div className="space-y-2">
              <p className="font-bold text-lg">⚠️ DANGER: IRREVERSIBLE ACTION</p>
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>All user accounts (Supabase Auth)</li>
                <li>All company data and employee records</li>
                <li>All leave requests, payslips, and attendance records</li>
                <li>All audit logs, notifications, and messages</li>
                <li>All documents, training, surveys, and feedback</li>
                <li>All storage buckets and uploaded files</li>
                <li>ALL DATABASE RECORDS (thousands of keys)</li>
              </ul>
              <p className="font-bold mt-2">There is NO UNDO. All data will be LOST FOREVER.</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Cleanup Configuration
            </CardTitle>
            <CardDescription>
              This utility is designed for development/testing environments only
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cleanup Key (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="cleanupKey">
                Cleanup Secret Key (Optional)
              </Label>
              <Input
                id="cleanupKey"
                type="password"
                placeholder="Leave empty if CLEANUP_SECRET_KEY is not set"
                value={cleanupKey}
                onChange={(e) => setCleanupKey(e.target.value)}
                disabled={isLoading || !!results}
              />
              <p className="text-sm text-gray-500">
                If you've set CLEANUP_SECRET_KEY in your environment, enter it here
              </p>
            </div>

            {/* Confirmation Input */}
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-red-600 font-bold">
                Type "DELETE ALL DATA" to confirm *
              </Label>
              <Input
                id="confirm"
                type="text"
                placeholder="DELETE ALL DATA"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isLoading || !!results}
                className={confirmText === 'DELETE ALL DATA' ? 'border-green-500' : ''}
              />
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Results Display */}
            {results && (
              <div className="space-y-4">
                <Alert className={results.success ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
                  {results.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <AlertDescription className={results.success ? 'text-green-800' : 'text-yellow-800'}>
                    <p className="font-bold mb-2">{results.message}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <div>
                          <p className="font-semibold">{results.details.authUsersDeleted}</p>
                          <p className="text-xs">Auth Users</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        <div>
                          <p className="font-semibold">{results.details.kvKeysDeleted}</p>
                          <p className="text-xs">KV Keys</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        <div>
                          <p className="font-semibold">{results.details.storageBucketsCleared}</p>
                          <p className="text-xs">Buckets</p>
                        </div>
                      </div>
                    </div>

                    {results.success && (
                      <p className="mt-4 text-sm font-medium">
                        ✅ Redirecting to homepage in 5 seconds...
                      </p>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Error Details */}
                {(results.errors.authUsers || results.errors.kvData || results.errors.storage) && (
                  <Alert className="border-orange-500 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <p className="font-bold mb-2">Some errors occurred:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {results.errors.authUsers && <li>Auth Users: {results.errors.authUsers}</li>}
                        {results.errors.kvData && <li>KV Data: {results.errors.kvData}</li>}
                        {results.errors.storage && <li>Storage: {results.errors.storage}</li>}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="destructive"
                onClick={handleCleanup}
                disabled={!canProceed || isLoading || !!results}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Deleting All Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Execute Production Cleanup
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>What happens after cleanup?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>The system will be in a completely clean state, ready for production use</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>All multi-tenant isolation rules remain intact and enforced</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>First company signup will create the first production tenant</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Payment verification is enforced before account creation</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>All security policies, RLS, and data isolation remain active</p>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-2">1. Optional Security Key Setup:</p>
              <p className="text-gray-600 mb-2">For added security, set an environment variable:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                CLEANUP_SECRET_KEY=your-secret-key-here
              </pre>
            </div>

            <div>
              <p className="font-semibold mb-2">2. Alternative: Direct API Call</p>
              <p className="text-gray-600 mb-2">You can also trigger cleanup via API:</p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`POST /make-server-668731fc/production/cleanup
Headers: X-Cleanup-Key: your-secret-key (if configured)

Response:
{
  "success": true,
  "message": "Production cleanup completed successfully...",
  "details": {
    "authUsersDeleted": 15,
    "kvKeysDeleted": 1247,
    "storageBucketsCleared": 2
  }
}`}
              </pre>
            </div>

            <div>
              <p className="font-semibold mb-2">3. After Cleanup:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                <li>Clear browser cache and local storage</li>
                <li>Visit the landing page</li>
                <li>First company can now register for production use</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}