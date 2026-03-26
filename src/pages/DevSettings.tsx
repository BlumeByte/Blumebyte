import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Settings, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            <CardTitle>Payment Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure your Paystack public key for subscription checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Payment setup required</strong>
              <br />
              Add your Paystack public key so the signup and subscription payment flow can initialize successfully.
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
                Enter a valid Paystack public key. Test keys start with <code>pk_test_</code> and live keys start with <code>pk_live_</code>.
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
              onClick={() => navigate('/company-signup')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Company Signup
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>How to find your Paystack key:</strong>
              <br />
              1. Log in to your Paystack Dashboard
              <br />
              2. Go to Settings → API Keys & Webhooks
              <br />
              3. Copy your Public Key and paste it above
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
