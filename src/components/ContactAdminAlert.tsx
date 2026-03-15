import React from 'react';
import { AlertCircle, Lock, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface ContactAdminAlertProps {
  message: string;
  type?: 'view-only' | 'department-only' | 'contact-admin';
}

export function ContactAdminAlert({ message, type = 'contact-admin' }: ContactAdminAlertProps) {
  const icons = {
    'view-only': Lock,
    'department-only': ShieldAlert,
    'contact-admin': AlertCircle,
  };

  const Icon = icons[type];

  return (
    <Alert className="bg-amber-50 border-amber-200">
      <Icon className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800 text-sm">
        {message}
      </AlertDescription>
    </Alert>
  );
}
