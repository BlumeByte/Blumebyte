import React from 'react';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/button';
import { Users } from 'lucide-react';
import { useBranding, brandGradientStyle } from '../lib/branding-context';
import { LicenseManagement } from './LicenseManagement';

export function SubscriptionPage() {
  const { logout } = useAuth();
  const { branding } = useBranding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center" 
              style={brandGradientStyle(branding?.primaryColor || '#1d4ed8')}
            >
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">License Management</h1>
          <p className="text-muted-foreground">Purchase user licenses for your organization</p>
        </div>

        <LicenseManagement />

        {/* Logout Button */}
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPage;