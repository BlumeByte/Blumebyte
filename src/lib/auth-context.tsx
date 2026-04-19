import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { api } from './api-client';
import { authLock } from './auth-lock';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  sessionLoading: boolean;
  loginLoading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  getToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const tokenCacheRef = useRef<{ token: string; expiresAt: number } | null>(null);
  const tokenFetchingRef = useRef<Promise<string | null> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const profile = await api('/profile', { token });
      setUser(profile);
      return profile;
    } catch (e) {
      console.log('Failed to fetch profile:', e);
      return null;
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    // If already fetching, wait for that promise
    if (tokenFetchingRef.current) {
      return tokenFetchingRef.current;
    }

    // Use the global auth lock to serialize all auth operations
    const fetchToken = async (): Promise<string | null> => {
      return authLock.acquire('getSession', async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.log('getSession error (likely expired refresh token):', error.message);
            // Invalid refresh token – clear state so user is sent back to login
            setUser(null);
            setAccessToken(null);
            await supabase.auth.signOut().catch(() => {});
            return null;
          }
          if (!data?.session) return null;
          const token = data.session.access_token;
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp - now < 60) {
              const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.log('Refresh token expired/invalid:', refreshError.message);
                setUser(null);
                setAccessToken(null);
                await supabase.auth.signOut().catch(() => {});
                return null;
              }
              if (refreshed?.session) {
                setAccessToken(refreshed.session.access_token);
                return refreshed.session.access_token;
              }
            }
          } catch (_) {}
          return token;
        } catch (e: any) {
          console.log('getToken unexpected error:', e.message);
          setUser(null);
          setAccessToken(null);
          return null;
        }
      });
    };

    tokenFetchingRef.current = fetchToken().finally(() => {
      tokenFetchingRef.current = null;
    });
    
    const token = await tokenFetchingRef.current;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        tokenCacheRef.current = { token, expiresAt };
      } catch (_) {}
    }
    return token;
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Only set timer if user is logged in
    if (user) {
      // 2 hours of inactivity before auto-logout (as requested)
      const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000;
      
      inactivityTimerRef.current = setTimeout(async () => {
        console.log('Auto-logout due to inactivity');
        await logout();
        window.location.href = '/login?reason=inactivity';
      }, INACTIVITY_TIMEOUT);
    }
  }, [user]);

  useEffect(() => {
    // Use onAuthStateChange as the single source of truth for session state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && !session) {
        // Refresh failed – stale session, force logout
        console.log('Token refresh failed, logging out');
        setUser(null);
        setAccessToken(null);
        if (!initializedRef.current) {
          initializedRef.current = true;
          setSessionLoading(false);
        }
        return;
      }

      if (session) {
        setAccessToken(session.access_token);
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchProfile(session.access_token);
        }
      } else {
        setUser(null);
        setAccessToken(null);
      }

      // Mark loading done after the first event (INITIAL_SESSION)
      if (!initializedRef.current) {
        initializedRef.current = true;
        setSessionLoading(false);
      }
    });

    // Safety fallback: if onAuthStateChange never fires (e.g. no persisted session),
    // stop loading after a short timeout.
    const timeout = setTimeout(() => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        setSessionLoading(false);
      }
    }, 800); // Reduced from 3000ms to 800ms for faster initial load

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile]);

  // Track user activity and page visibility
  useEffect(() => {
    if (!user) return;

    // Activity events to track
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Page is hidden - store the time when tab was hidden
        lastActivityRef.current = Date.now();
        // Do NOT cancel the inactivity timer - it continues running so that if
        // the user is away from ALL tabs for 1 hour, they will be logged out.
      } else {
        // Page is visible again - check how long it was hidden
        const hiddenDuration = Date.now() - lastActivityRef.current;
        // Only force logout if hidden for more than 2 hours (same as inactivity timeout)
        const MAX_HIDDEN_DURATION = 2 * 60 * 60 * 1000; // 2 hours
        
        if (hiddenDuration > MAX_HIDDEN_DURATION) {
          console.log('Auto-logout: Page was hidden for too long');
          await logout();
          window.location.href = '/login?reason=session_expired';
        } else {
          // Reset the timer when page becomes visible again so the 1hr starts fresh
          resetInactivityTimer();
        }
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize inactivity timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer]);

  const login = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid login') || msg.includes('invalid_credentials')) {
          throw new Error('Incorrect email or password. Please double-check your credentials and try again.');
        }
        throw new Error(error.message);
      }
      if (data?.session) {
        setAccessToken(data.session.access_token);
        const profile = await fetchProfile(data.session.access_token);
        
        // Auto clock-in: Only for non-admin users (employee, manager)
        if (profile && (profile.role === 'employee' || profile.role === 'manager')) {
          try {
            // Check if user has already clocked in today
            const today = new Date().toISOString().split('T')[0];
            const attendanceCheck = await api('/attendance/today', { token: data.session.access_token }).catch(() => null);
            
            // Only clock in if user hasn't clocked in today
            if (!attendanceCheck || !attendanceCheck.clockIn) {
              await api('/attendance/clock-in', {
                method: 'POST',
                token: data.session.access_token,
                body: JSON.stringify({
                  date: today,
                  clockIn: new Date().toISOString(),
                  status: 'present',
                }),
              });
              console.log('✅ Auto clock-in successful on login');
            } else {
              console.log('ℹ️ Already clocked in today, skipping auto clock-in');
            }
          } catch (clockError) {
            // Don't fail login if clock-in fails
            console.log('Auto clock-in failed (non-critical):', clockError);
          }
        }
      }
    } catch (e: any) {
      setLoginError(e.message);
      throw e;
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // signOut may fail if session is already invalid – that's fine
      console.log('signOut error (session may already be invalid):', e);
    }
    setUser(null);
    setAccessToken(null);
    
    // Clear inactivity timer on logout
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const clearError = () => setLoginError(null);

  const refreshProfile = async () => {
    const token = await getToken();
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, sessionLoading, loginLoading, loginError, login, logout, clearError, getToken, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // During development/hot reload, context might not be initialized yet
    // Return a safe default instead of throwing
    return {
      user: null,
      accessToken: null,
      sessionLoading: true,
      loginLoading: false,
      loginError: null,
      login: async () => {},
      logout: async () => {},
      clearError: () => {},
      getToken: async () => null,
      refreshProfile: async () => {},
    };
  }
  return ctx;
}