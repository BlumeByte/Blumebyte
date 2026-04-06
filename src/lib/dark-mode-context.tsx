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

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      document.documentElement.classList.remove('dark');
      return;
    }

    // Load dark mode setting from company settings
    api('/company-settings', { token: accessToken })
      .then((settings) => {
        const isDark = settings?.darkMode === true;
        setDarkMode(isDark);
        
        // Apply dark mode to HTML element for global application
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }
      })
      .catch((err) => {
        console.log('Error loading dark mode settings:', err);
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
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
          
          if (isDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
          }
        })
        .catch(console.log);
    };

    window.addEventListener('branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('branding-updated', handleBrandingUpdate);
  }, [accessToken]);

  return (
    <DarkModeContext.Provider value={{ darkMode, loading }}>
      <div className={darkMode ? 'dark' : ''}>
        {children}
      </div>
    </DarkModeContext.Provider>
  );
}