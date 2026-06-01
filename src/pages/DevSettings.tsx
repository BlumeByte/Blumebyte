import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Settings, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { DeploymentStatusCheck } from '../components/DeploymentStatusCheck';

export default function DevSettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <DeploymentStatusCheck />

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <CardTitle>Developer Settings</CardTitle>
            </div>
            <CardDescription>
              Verify deployment and server-owned payment configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Payment Configuration</strong>
                <br />
                Paystack keys are read only from server environment variables. Configure{' '}
                <code className="rounded bg-blue-100 px-1">PAYSTACK_PUBLIC_KEY</code>,{' '}
                <code className="rounded bg-blue-100 px-1">PAYSTACK_SECRET_KEY</code>, and{' '}
                <code className="rounded bg-blue-100 px-1">PAYSTACK_CURRENCY</code> in Supabase
                before accepting live payments.
              </p>
            </div>

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/company/signup')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Company Signup
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Production Cleanup Utility</p>
                    <p className="text-xs text-red-700 mt-1">
                      Clear all test data and reset the system to a production-ready state. This action is irreversible.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => navigate('/production-cleanup')}
                      className="mt-3 w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Access Production Cleanup
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
