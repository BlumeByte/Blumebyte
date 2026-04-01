import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertTriangle, CreditCard, Users, ShoppingCart, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';

export function LicenseStatusBanner() {
  // TEMPORARILY DEACTIVATED - Subscription logic disabled
  return null;
  
  /*
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  const fetchLicenseStatus = async () => {
    if (!user || user.role !== 'superadmin') {
      setLoading(false);
      return;
    }

    try {
      const data = await api('/subscription/license-info', { token: accessToken });
      setLicenseInfo(data);
    } catch (error) {
      console.error('Error fetching license status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only show for SuperAdmin
  if (!user || user.role !== 'superadmin' || loading) {
    return null;
  }

  // No subscription at all
  if (!licenseInfo || licenseInfo.subscriptionStatus !== 'active') {
    return (
      <Alert variant="destructive" className="mb-6 border-2 animate-pulse">
        <CreditCard className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">🚨 URGENT: No Active Subscription</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p className="font-semibold">
              Your organization does not have an active subscription. All users (except you) are locked out of the system.
            </p>
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="text-sm text-red-900 font-medium">
                ⚠️ Purchase licenses immediately to restore access for your team.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/superadmin/settings')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase Licenses Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Running out of licenses
  if (licenseInfo.availableLicenses <= 0) {
    return (
      <Alert variant="destructive" className="mb-6 border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">⚠️ No Licenses Available</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p>
              You have <strong className="text-red-700">{licenseInfo.usedLicenses || 0} of {licenseInfo.purchasedLicenses || 0}</strong> licenses in use.
              You cannot add new users until you purchase more licenses.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/superadmin/settings')}
                variant="destructive"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy More Licenses
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Low on licenses (less than 3)
  if (licenseInfo.availableLicenses < 3) {
    return (
      <Alert className="mb-6 border-yellow-300 bg-yellow-50">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-lg font-bold text-yellow-900">
          ⚠️ Running Low on Licenses
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p className="text-yellow-900">
              Only <strong className="text-yellow-700">{licenseInfo.availableLicenses} license(s)</strong> remaining 
              out of {licenseInfo.purchasedLicenses} purchased.
            </p>
            <Button 
              onClick={() => navigate('/superadmin/settings')}
              variant="outline"
              className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase More Licenses
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
  */
}

// For non-SuperAdmin users - shows if they need to contact SuperAdmin
export function UserLicenseAlert() {
  // TEMPORARILY DEACTIVATED - Subscription logic disabled
  return null;
  
  /*
  const { user } = useAuth();

  // Only show for non-SuperAdmin users
  if (!user || user.role === 'superadmin') {
    return null;
  }

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Users className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-lg font-semibold text-blue-900">
        ℹ️ License-Based Access
      </AlertTitle>
      <AlertDescription className="mt-2 text-blue-900">
        <p className="text-sm">
          Your access to this system is managed through purchased user licenses. 
          If you experience any access issues, please contact your <strong>SuperAdmin</strong> to verify 
          that sufficient licenses have been purchased and payment is up to date.
        </p>
      </AlertDescription>
    </Alert>
  );
  */
}

// Critical alert for when trying to create user without licenses (Admin/Manager)
export function NoLicenseCreateAlert({ onContactSuperAdmin }: { onContactSuperAdmin?: () => void }) {
  return (
    <Alert variant="destructive" className="border-2">
      <ShoppingCart className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">Cannot Create User - No Licenses Available</AlertTitle>
      <AlertDescription className="mt-3 space-y-3">
        <div className="bg-red-50 border border-red-200 p-3 rounded">
          <p className="font-semibold text-red-900 mb-2">
            🚫 User creation is blocked
          </p>
          <p className="text-sm text-red-900">
            Your organization has reached its license limit. Only SuperAdmin can create new users, 
            and they must purchase additional licenses first.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
          <p className="font-bold text-blue-900 mb-2">📞 Action Required:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-blue-900">
            <li>Contact your <strong>SuperAdmin</strong> immediately</li>
            <li>Request them to purchase additional user licenses</li>
            <li>Once purchased, SuperAdmin can create new users</li>
          </ol>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Note: Only SuperAdmin can create users in the license-based subscription model
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Alert when payment/subscription is about to expire
export function SubscriptionExpiryAlert({ daysRemaining }: { daysRemaining: number }) {
  const navigate = useNavigate();

  if (daysRemaining > 7) {
    return null;
  }

  return (
    <Alert className="mb-6 border-orange-300 bg-orange-50">
      <Zap className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-lg font-bold text-orange-900">
        ⏰ Subscription Expiring Soon
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p className="text-orange-900">
            Your subscription will expire in <strong className="text-orange-700">{daysRemaining} day(s)</strong>.
            {daysRemaining <= 3 && ' All users will lose access when it expires!'}
          </p>
          <Button 
            onClick={() => navigate('/superadmin/settings')}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Renew Subscription Now
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}