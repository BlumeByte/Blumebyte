import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Phone, Mail, AlertTriangle, CreditCard, Users } from 'lucide-react';

interface ContactSuperAdminAlertProps {
  reason: 'no_subscription' | 'insufficient_licenses' | 'account_inactive' | 'subscription_inactive' | 'create_user_blocked';
  onDismiss?: () => void;
}

export function ContactSuperAdminAlert({ reason, onDismiss }: ContactSuperAdminAlertProps) {
  const alertConfigs = {
    no_subscription: {
      icon: CreditCard,
      title: '⚠️ No Active Subscription',
      description: 'The system does not have an active subscription. All functions are disabled until SuperAdmin purchases licenses.',
      actionText: 'Contact SuperAdmin to purchase licenses immediately',
      variant: 'destructive' as const,
    },
    insufficient_licenses: {
      icon: Users,
      title: '🚫 No Licenses Available',
      description: 'All purchased user licenses are in use. SuperAdmin must purchase additional licenses before new users can be added.',
      actionText: 'Contact SuperAdmin to buy more user licenses',
      variant: 'destructive' as const,
    },
    account_inactive: {
      icon: AlertTriangle,
      title: '⛔ Your Account is Inactive',
      description: 'Your account has been deactivated due to insufficient licenses or subscription issues. You cannot access the system until your account is reactivated.',
      actionText: 'Contact SuperAdmin to activate your account',
      variant: 'destructive' as const,
    },
    subscription_inactive: {
      icon: CreditCard,
      title: '🔒 Subscription Payment Required',
      description: 'The organization\'s subscription has expired or payment has failed. System access is suspended for all users until SuperAdmin renews the subscription.',
      actionText: 'Urgently contact SuperAdmin to complete payment',
      variant: 'destructive' as const,
    },
    create_user_blocked: {
      icon: Users,
      title: '🚫 Cannot Create New Users',
      description: 'Only SuperAdmin can create new users in the license-based subscription model. Contact SuperAdmin if you need to add team members.',
      actionText: 'Contact SuperAdmin to create new users',
      variant: 'default' as const,
    },
  };

  const config = alertConfigs[reason];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className="border-2 animate-in fade-in-50 slide-in-from-top-2">
      <Icon className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">{config.title}</AlertTitle>
      <AlertDescription className="mt-3 space-y-4">
        <p className="text-sm">{config.description}</p>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="font-bold text-blue-900 mb-3">📞 What You Need to Do:</p>
          <div className="space-y-2 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">1.</span>
              <span><strong>Contact your SuperAdmin immediately</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">2.</span>
              <span>{config.actionText}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">3.</span>
              <span>Wait for SuperAdmin to complete the purchase/payment</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">4.</span>
              <span>Your access will be restored automatically once payment is confirmed</span>
            </div>
          </div>
        </div>

        {reason === 'insufficient_licenses' && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <p className="text-xs text-yellow-900">
              <strong>Note:</strong> SuperAdmin can purchase additional licenses from the Settings → License Management page. 
              Licenses are $2.59/month or $43.08/year per user.
            </p>
          </div>
        )}

        {reason === 'no_subscription' && (
          <div className="bg-red-50 border border-red-200 p-3 rounded">
            <p className="text-xs text-red-900 font-semibold">
              ⚠️ URGENT: No users can access the system (except SuperAdmin) until payment is made!
            </p>
          </div>
        )}

        {onDismiss && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Understood
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Inline version for dialogs
export function InlineContactSuperAdminMessage({ reason }: { reason: ContactSuperAdminAlertProps['reason'] }) {
  const messages = {
    no_subscription: 'Contact SuperAdmin to purchase licenses',
    insufficient_licenses: 'Contact SuperAdmin to buy more user licenses',
    account_inactive: 'Contact SuperAdmin to activate your account',
    subscription_inactive: 'Contact SuperAdmin to renew subscription',
    create_user_blocked: 'Contact SuperAdmin to create new users',
  };

  return (
    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-3">
      <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
        <Phone className="w-4 h-4" />
        {messages[reason]}
      </p>
      <p className="text-xs text-blue-800 mt-1">
        Only SuperAdmin can manage licenses and subscriptions
      </p>
    </div>
  );
}
