import React, { createContext, useContext, useEffect, useState } from 'react';
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

function applyDarkMode(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage for instant application (avoids flash)
    return localStorage.getItem('darkMode') === 'true';
  });
  const [loading, setLoading] = useState(true);

  // Apply dark mode immediately on mount from cached value. The dependency array
  // is intentionally empty: this effect runs only once to avoid overwriting the
  // freshly-loaded setting (managed by the other useEffect below).
  useEffect(() => {
    applyDarkMode(darkMode);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once on mount

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      setDarkMode(false);
      applyDarkMode(false);
      localStorage.removeItem('darkMode');
      return;
    }

    // Load dark mode setting from company settings
    api('/company-settings', { token: accessToken })
      .then((settings) => {
        const isDark = settings?.darkMode === true;
        setDarkMode(isDark);
        applyDarkMode(isDark);
        // Cache for next load
        if (isDark) {
          localStorage.setItem('darkMode', 'true');
        } else {
          localStorage.removeItem('darkMode');
        }
      })
      .catch((err) => {
        console.log('Error loading dark mode settings:', err);
        applyDarkMode(false);
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
          applyDarkMode(isDark);
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
  }, [accessToken]);

  return (
    <DarkModeContext.Provider value={{ darkMode, loading }}>
      {children}
    </DarkModeContext.Provider>
  );
}