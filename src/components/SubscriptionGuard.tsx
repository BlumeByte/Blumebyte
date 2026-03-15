import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api-client.tsx';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    // Only SuperAdmins need active subscriptions
    // Other roles are covered under the SuperAdmin's subscription
    if (user?.role !== 'superadmin') {
      setSubscriptionActive(true);
      setChecking(false);
      return;
    }

    try {
      const response = await apiClient.get('/subscription/status', accessToken);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'active') {
          setSubscriptionActive(true);
        } else {
          // Subscription expired or doesn't exist
          navigate('/subscription', { replace: true });
        }
      } else {
        // No subscription found
        navigate('/subscription', { replace: true });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // On error, redirect to subscription page to be safe
      navigate('/subscription', { replace: true });
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (!subscriptionActive) {
    return null; // Will redirect to subscription page
  }

  return <>{children}</>;
}