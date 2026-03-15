import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

export function ForcePasswordChange() {
  const { user, accessToken, refreshProfile, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const passwordChecks = [
    { label: 'At least 8 characters', pass: newPassword.length >= 8 },
    { label: 'Contains uppercase letter', pass: /[A-Z]/.test(newPassword) },
    { label: 'Contains lowercase letter', pass: /[a-z]/.test(newPassword) },
    { label: 'Contains a number', pass: /\d/.test(newPassword) },
    { label: 'Contains special character', pass: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(newPassword) },
    { label: 'Passwords match', pass: newPassword.length > 0 && newPassword === confirmPassword },
  ];

  const allPassed = passwordChecks.every(c => c.pass);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current (temporary) password');
      return;
    }
    if (!allPassed) {
      setError('Please meet all password requirements');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current password');
      return;
    }

    setSaving(true);
    try {
      await api('/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
        token: accessToken,
      });

      // Re-sign in with the new password to get a fresh session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: newPassword,
      });

      if (signInError) {
        // Password was changed but re-login failed — force manual re-login
        toast.success('Password changed! Please log in with your new password.');
        await logout();
        return;
      }

      // Refresh the profile to pick up mustChangePassword: false
      await refreshProfile();
      toast.success('Password changed successfully! Welcome to the platform.');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Your Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, <span className="font-medium text-gray-700">{user?.name}</span>! For security, please create your own password before continuing.
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Create New Password
            </CardTitle>
            <CardDescription className="text-xs">
              Your admin-provided temporary password must be replaced with a strong personal password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <Label htmlFor="current" className="text-xs font-medium">Current (Temporary) Password</Label>
                <div className="relative">
                  <Input
                    id="current"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => { setCurrentPassword(e.target.value); setError(''); }}
                    placeholder="Enter the password given by your admin"
                    className="pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label htmlFor="new" className="text-xs font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="new"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="Create a strong password"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Re-enter your new password"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Checklist */}
              {newPassword.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-medium text-gray-600 mb-2">Password Requirements</p>
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {check.pass ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${check.pass ? 'text-green-700' : 'text-gray-500'}`}>{check.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={saving || !allPassed}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Updating Password...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4 mr-2" />Set Password & Continue</>
                )}
              </Button>
            </form>

            <div className="mt-4 pt-3 border-t">
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors w-full text-center"
              >
                Log out and return to login page
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          This is a one-time security step. You won't be asked again after setting your password.
        </p>
      </div>
    </div>
  );
}
