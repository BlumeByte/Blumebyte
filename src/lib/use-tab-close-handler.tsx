import { useEffect, useRef } from 'react';
import { useAuth } from './auth-context';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-668731fc`;

/**
 * Hook that handles auto clock-out and logout reporting when user closes tab/browser
 * Sends report to superadmins and admins with username and login/logout times
 */
export function useTabCloseHandler() {
  const { user, accessToken, logout } = useAuth();
  const clockedInRef = useRef(false);
  const loginTimeRef = useRef<string>('');

  useEffect(() => {
    // Store login time when user is authenticated
    if (user && accessToken) {
      if (!loginTimeRef.current) {
        loginTimeRef.current = new Date().toISOString();
      }

      // Check if user is clocked in
      const checkClockInStatus = async () => {
        try {
          const response = await fetch(`${BASE}/attendance/status`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (response.ok) {
            const data = await response.json();
            clockedInRef.current = data.clockedIn || false;
          }
        } catch (e) {
          console.log('Clock status check error:', e);
        }
      };

      checkClockInStatus();
    }
  }, [user, accessToken]);

  useEffect(() => {
    if (!user || !accessToken) return;

    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      const logoutTime = new Date().toISOString();
      const userName = user.user_metadata?.name || user.email || 'Unknown User';

      // Prepare the report data
      const reportData = {
        userId: user.id,
        userName: userName,
        email: user.email,
        loginTime: loginTimeRef.current,
        logoutTime: logoutTime,
        wasAutoClockedOut: clockedInRef.current,
        logoutType: 'tab_close',
      };

      try {
        // Use sendBeacon for reliable delivery even as page unloads
        const blob = new Blob([JSON.stringify(reportData)], { type: 'application/json' });
        navigator.sendBeacon(
          `${BASE}/session/logout-report`,
          blob
        );

        // Auto clock-out if user was clocked in
        if (clockedInRef.current) {
          const clockOutBlob = new Blob([JSON.stringify({ userId: user.id, auto: true })], { type: 'application/json' });
          navigator.sendBeacon(
            `${BASE}/attendance/auto-clock-out`,
            clockOutBlob
          );
        }

        // Clear local storage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user-data');
      } catch (error) {
        console.error('Tab close handler error:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab is being hidden (closed or switched)
        // We don't fully log out here, just prepare
        clockedInRef.current = localStorage.getItem('clocked-in') === 'true';
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, accessToken]);

  return null;
}
