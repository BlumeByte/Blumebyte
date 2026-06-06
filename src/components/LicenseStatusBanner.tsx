import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { AlertTriangle, CreditCard, ShoppingCart, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(value: any): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / MS_PER_DAY);
}

function reminderKey(tenantId: string, daysLeft: number | null, status: string) {
  const now = new Date();
  if (status !== 'active' || daysLeft == null || daysLeft <= 7) {
    return `${tenantId}:daily:${now.toISOString().slice(0, 10)}`;
  }
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now.getTime() - oneJan.getTime()) / MS_PER_DAY) + oneJan.getDay() + 1) / 7);
  return `${tenantId}:weekly:${now.getFullYear()}-${week}`;
}

export function LicenseStatusBanner() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchLicenseStatus();
    const interval = setInterval(fetchLicenseStatus, 60_000);
    return () => clearInterval(interval);
  }, [user?.id, user?.role, accessToken]);

  const status = String(
    licenseInfo?.licenseStatus ||
    licenseInfo?.status ||
    licenseInfo?.subscriptionStatus ||
    'none'
  ).toLowerCase();
  const daysLeft = useMemo(() => daysUntil(licenseInfo?.endDate), [licenseInfo?.endDate]);
  const shouldShowExpiry = licenseInfo && (status !== 'active' || (daysLeft != null && daysLeft <= 30));

  useEffect(() => {
    if (!user || user.role !== 'superadmin' || !licenseInfo || !shouldShowExpiry) return;
    const tenantId = licenseInfo.companyId || user.companyId || user.id || 'tenant';
    const key = `bbhr-subscription-reminder:${reminderKey(tenantId, daysLeft, status)}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'shown');

    const message = status !== 'active'
      ? 'Your subscription is expired. Renew now to restore access automatically after payment.'
      : daysLeft != null && daysLeft <= 7
      ? `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew now to extend your current expiry.`
      : `Your subscription expires in ${daysLeft} days. Weekly renewal reminders are enabled for the final month.`;

    toast.warning(message, {
      duration: 10000,
      action: { label: 'Renew', onClick: () => navigate('/superadmin/settings') },
    });
  }, [daysLeft, licenseInfo, navigate, shouldShowExpiry, status, user]);

  if (!user || user.role !== 'superadmin' || loading) return null;

  if (!licenseInfo || status !== 'active') {
    return (
      <Alert variant="destructive" className="mb-6 border-2">
        <CreditCard className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">Subscription expired</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p className="font-semibold">
              Your organization does not have an active subscription. All users except Super Admin are locked out.
            </p>
            <div className="bg-red-50 border border-red-200 p-3 rounded">
              <p className="text-sm text-red-900 font-medium">
                Renew now. Once payment is verified, the dashboard unlocks automatically.
              </p>
            </div>
            <Button onClick={() => navigate('/superadmin/settings')} className="bg-red-600 hover:bg-red-700 text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Renew Subscription
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (daysLeft != null && daysLeft <= 30) {
    const urgent = daysLeft <= 7;
    return (
      <Alert className={`mb-6 border-2 ${urgent ? 'border-orange-300 bg-orange-50' : 'border-yellow-300 bg-yellow-50'}`}>
        <AlertTriangle className={`h-5 w-5 ${urgent ? 'text-orange-600' : 'text-yellow-600'}`} />
        <AlertTitle className={`text-lg font-bold ${urgent ? 'text-orange-900' : 'text-yellow-900'}`}>
          Subscription expires in {daysLeft} day{daysLeft === 1 ? '' : 's'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p className={urgent ? 'text-orange-900' : 'text-yellow-900'}>
              You can renew now. Early renewal extends from the current expiry date, so remaining time is not lost.
            </p>
            <Button onClick={() => navigate('/superadmin/settings')} variant={urgent ? 'default' : 'outline'}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Renew Subscription
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (licenseInfo.availableLicenses <= 0) {
    return (
      <Alert variant="destructive" className="mb-6 border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">No licenses available</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p>
              You have <strong className="text-red-700">{licenseInfo.usedLicenses || 0} of {licenseInfo.purchasedLicenses || 0}</strong> licenses in use.
            </p>
            <Button onClick={() => navigate('/superadmin/settings')} variant="destructive">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy More Licenses
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (licenseInfo.availableLicenses < 3) {
    return (
      <Alert className="mb-6 border-yellow-300 bg-yellow-50">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-lg font-bold text-yellow-900">Running low on licenses</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p className="text-yellow-900">
              Only <strong className="text-yellow-700">{licenseInfo.availableLicenses} license(s)</strong> remaining out of {licenseInfo.purchasedLicenses} purchased.
            </p>
            <Button onClick={() => navigate('/superadmin/settings')} variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase More Licenses
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export function UserLicenseAlert() {
  const { user } = useAuth();
  if (!user || user.role === 'superadmin') return null;

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Users className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-lg font-semibold text-blue-900">License-based access</AlertTitle>
      <AlertDescription className="mt-2 text-blue-900">
        <p className="text-sm">
          Your access is managed through purchased user licenses. Contact your Super Admin if access is blocked or a renewal is required.
        </p>
      </AlertDescription>
    </Alert>
  );
}

export function NoLicenseCreateAlert({ onContactSuperAdmin }: { onContactSuperAdmin?: () => void }) {
  return (
    <Alert variant="destructive" className="border-2">
      <ShoppingCart className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">Cannot create user: no licenses available</AlertTitle>
      <AlertDescription className="mt-3 space-y-3">
        <div className="bg-red-50 border border-red-200 p-3 rounded">
          <p className="font-semibold text-red-900 mb-2">User creation is blocked</p>
          <p className="text-sm text-red-900">
            Your organization has reached its license limit. Only Super Admin can purchase additional licenses.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
          <p className="font-bold text-blue-900 mb-2">Action required:</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-blue-900">
            <li>Contact your Super Admin immediately</li>
            <li>Request additional user licenses</li>
            <li>Once purchased, user creation is restored automatically</li>
          </ol>
        </div>
        {onContactSuperAdmin && (
          <Button type="button" variant="outline" onClick={onContactSuperAdmin}>
            Contact Super Admin
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function SubscriptionExpiryAlert({ daysRemaining }: { daysRemaining: number }) {
  const navigate = useNavigate();

  if (daysRemaining > 30) return null;

  return (
    <Alert className="mb-6 border-orange-300 bg-orange-50">
      <Zap className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-lg font-bold text-orange-900">Subscription expiring soon</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p className="text-orange-900">
            Your subscription will expire in <strong className="text-orange-700">{daysRemaining} day(s)</strong>.
          </p>
          <Button onClick={() => navigate('/superadmin/settings')} className="bg-orange-600 hover:bg-orange-700 text-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Renew Subscription Now
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
