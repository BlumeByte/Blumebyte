import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Settings, Save, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { DeploymentStatusCheck } from '../components/DeploymentStatusCheck';

export default function DevSettings() {
  const navigate = useNavigate();
  const [publicKey, setPublicKey] = useState(
    localStorage.getItem('paystack_public_key') || ''
  );

  const handleSave = () => {
    if (!publicKey.startsWith('pk_test_') && !publicKey.startsWith('pk_live_')) {
      toast.error('Invalid Paystack public key format. Should start with pk_test_ or pk_live_');
      return;
    }

    localStorage.setItem('paystack_public_key', publicKey);
    toast.success('Paystack public key saved successfully!');
  };

  const handleClear = () => {
    localStorage.removeItem('paystack_public_key');
    setPublicKey('');
    toast.success('Paystack public key cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Deployment Status Check */}
        <DeploymentStatusCheck />

        {/* Paystack Settings */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <CardTitle>Developer Settings</CardTitle>
            </div>
            <CardDescription>
              Configure Paystack public key temporarily (for testing only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Temporary Configuration</strong>
                <br />
                This page allows you to set the Paystack public key in localStorage while the server endpoint is being deployed.
                Once the server is ready, this won't be necessary.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publicKey">Paystack Public Key</Label>
                <Input
                  id="publicKey"
                  placeholder="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                />
                <p className="text-xs text-gray-600">
                  Your Paystack public key (starts with pk_test_ for test mode or pk_live_ for live mode)
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Key
                </Button>
                <Button onClick={handleClear} variant="outline" className="flex-1">
                  Clear Key
                </Button>
              </div>
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

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How to get your Paystack key:</strong>
                <br />
                1. Log in to your Paystack Dashboard
                <br />
                2. Go to Settings → API Keys & Webhooks
                <br />
                3. Copy your Public Key (for testing, use the Test Public Key)
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Production Cleanup Utility</p>
                    <p className="text-xs text-red-700 mt-1">
                      Clear ALL test data and reset the system to production-ready state. This action is IRREVERSIBLE!
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