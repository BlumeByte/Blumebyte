import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api-client.tsx';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

export function SubscriptionBadge() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRenewing, setAutoRenewing] = useState(false);
  const autoRenewAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    fetchSubscriptionInfo();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchSubscriptionInfo, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const attemptAutoRenew = async (info: any) => {
    const attemptKey = `${info?.endDate || 'unknown'}:${info?.status || 'unknown'}`;
    if (autoRenewAttemptedRef.current === attemptKey) return;
    autoRenewAttemptedRef.current = attemptKey;

    try {
      setAutoRenewing(true);
      const response = await apiClient.post('/subscription/auto-renew', {}, accessToken);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false) {
        toast.error(data?.message || data?.error || 'Auto-renewal attempt failed');
        return;
      }
      toast.success('Saved-card auto-renewal completed successfully.');
      await fetchSubscriptionInfo();
    } catch (error: any) {
      toast.error(error?.message || 'Auto-renewal attempt failed');
    } finally {
      setAutoRenewing(false);
    }
  };

  const fetchSubscriptionInfo = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.get('/subscription/status', accessToken);
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
        if (
          data?.status === 'expired' &&
          data?.isSubscriptionOwner === true &&
          data?.autoRenewEligible === true
        ) {
          void attemptAutoRenew(data);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="outline" className="bg-gray-50">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        <span className="text-xs">Loading...</span>
      </Badge>
    );
  }

  if (!subscriptionInfo || subscriptionInfo.status === 'none') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-700 border-red-200 cursor-pointer hover:bg-red-100"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span className="text-xs">No Subscription</span>
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">No Active Subscription</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You need an active subscription to use the system.
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/subscription')}
            >
              <CreditCard className="w-3 h-3 mr-2" />
              Subscribe Now
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const isExpired = subscriptionInfo.status === 'expired';
  const daysRemaining = subscriptionInfo.daysRemaining || 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isExpired) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge 
            variant="outline" 
            className="bg-red-50 text-red-700 border-red-200 cursor-pointer hover:bg-red-100 animate-pulse"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span className="text-xs">Expired</span>
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Subscription Expired</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your subscription expired on {subscriptionInfo.endDate ? formatDate(subscriptionInfo.endDate) : 'N/A'}.
                </p>
                {subscriptionInfo.autoRenewEligible && (
                  <p className="text-xs text-blue-600 mt-1">
                    Saved-card auto-renew is enabled.
                    {autoRenewing ? ' Attempting charge now…' : ' You can retry renewal from Subscription.'}
                  </p>
                )}
              </div>
            </div>
            <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium capitalize">{subscriptionInfo.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Users:</span>
                <span className="font-medium">{subscriptionInfo.userCount}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/subscription')}
            >
              <CreditCard className="w-3 h-3 mr-2" />
              Renew Subscription
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (isExpiringSoon) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge 
            variant="outline" 
            className="bg-yellow-50 text-yellow-700 border-yellow-200 cursor-pointer hover:bg-yellow-100"
          >
            <Clock className="w-3 h-3 mr-1" />
            <span className="text-xs">{daysRemaining} days left</span>
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Subscription Expiring Soon</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium capitalize">{subscriptionInfo.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium">{subscriptionInfo.endDate ? formatDate(subscriptionInfo.endDate) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Users:</span>
                <span className="font-medium">{subscriptionInfo.userCount}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/subscription')}
            >
              <CreditCard className="w-3 h-3 mr-2" />
              Renew Now
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Active subscription
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant="outline" 
          className="bg-green-50 text-green-700 border-green-200 cursor-pointer hover:bg-green-100"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          <span className="text-xs">Active</span>
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Subscription Active</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your subscription is active and in good standing.
              </p>
            </div>
          </div>
          <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium capitalize">{subscriptionInfo.plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Renews:</span>
              <span className="font-medium">{subscriptionInfo.endDate ? formatDate(subscriptionInfo.endDate) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days Remaining:</span>
              <span className="font-medium text-green-600">{daysRemaining}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Users:</span>
              <span className="font-medium">{subscriptionInfo.userCount}</span>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            onClick={() => navigate('/subscription')}
          >
            View Details
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
