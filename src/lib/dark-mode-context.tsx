import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { api } from './api-client';
import { useAuth } from './auth-context';

interface DarkModeContextType {
  darkMode: boolean;
  loading: boolean;
}

const DarkModeContext = createContext<DarkModeContextType>({
  darkMode: false,
  loading: true,
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}

/** Dashboard routes where dark mode should be applied. */
const DASHBOARD_PATHS = ['/admin', '/manager', '/employee', '/superadmin', '/notifications'];

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function applyDarkMode(isDark: boolean, pathname: string) {
  // Dark mode must ONLY affect dashboard routes. On public pages it must be off.
  if (isDark && isDashboardPath(pathname)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, logout } = useAuth();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage for instant application (avoids flash)
    return localStorage.getItem('darkMode') === 'true';
  });
  const [loading, setLoading] = useState(true);
  const prevPathRef = useRef(location.pathname);

  // Apply dark mode immediately on mount from cached value. The dependency array
  // is intentionally empty: this effect runs only once to avoid overwriting the
  // freshly-loaded setting (managed by the other useEffect below).
  useEffect(() => {
    applyDarkMode(darkMode, location.pathname);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once on mount

  // When route changes: reapply dark-mode scoping and handle dashboard→public logout.
  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location.pathname;

    // Re-evaluate dark mode whenever the URL changes so public pages stay light.
    applyDarkMode(darkMode, curr);

    // Auto-logout when navigating FROM a dashboard route TO a public route.
    if (accessToken && isDashboardPath(prev) && !isDashboardPath(curr)) {
      logout().catch(() => {});
    }

    prevPathRef.current = curr;
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setDarkMode(false);
      applyDarkMode(false, location.pathname);
      localStorage.removeItem('darkMode');
      return;
    }

    // Load dark mode setting from company settings
    api('/company-settings', { token: accessToken })
      .then((settings) => {
        const isDark = settings?.darkMode === true;
        setDarkMode(isDark);
        applyDarkMode(isDark, location.pathname);
        // Cache for next load
        if (isDark) {
          localStorage.setItem('darkMode', 'true');
        } else {
          localStorage.removeItem('darkMode');
        }
      })
      .catch((err) => {
        console.log('Error loading dark mode settings:', err);
        applyDarkMode(false, location.pathname);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for branding updates
    const handleBrandingUpdate = () => {
      api('/company-settings', { token: accessToken })
        .then((settings) => {
          const isDark = settings?.darkMode === true;
          setDarkMode(isDark);
          applyDarkMode(isDark, location.pathname);
          if (isDark) {
            localStorage.setItem('darkMode', 'true');
          } else {
            localStorage.removeItem('darkMode');
          }
        })
        .catch(console.log);
    };

    window.addEventListener('branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('branding-updated', handleBrandingUpdate);
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DarkModeContext.Provider value={{ darkMode, loading }}>
      {children}
    </DarkModeContext.Provider>
  );
}