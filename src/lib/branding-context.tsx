import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { publicAnonKey } from '../utils/supabase/info';
import { supabase } from './supabase';
import { fetchFunctionsUrl } from './functions-base';

export interface CompanyBranding {
  companyName: string;
  description: string;
  primaryColor: string;
  logoUrl: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
}

const DEFAULT_BRANDING: CompanyBranding = {
  companyName: 'Blumebyte',
  description: 'Human Resource Information System',
  primaryColor: '#10b981',
  logoUrl: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyWebsite: '',
};

interface BrandingContextType {
  branding: CompanyBranding;
  refresh: () => void;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  refresh: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<CompanyBranding>(DEFAULT_BRANDING);

  const fetchBranding = useCallback(async () => {
    try {
      // Get the current Supabase session token
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        // If not logged in, use default branding
        setBranding(DEFAULT_BRANDING);
        return;
      }

      const res = await fetchFunctionsUrl('/company-settings', {
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': token
        },
      });
      
      if (res.ok) {
        const settings = await res.json();
        const updatedBranding: CompanyBranding = {
          companyName: settings.companyName || DEFAULT_BRANDING.companyName,
          description: settings.description || DEFAULT_BRANDING.description,
          primaryColor: settings.primaryColor || DEFAULT_BRANDING.primaryColor,
          logoUrl: settings.logoUrl || '',
          companyAddress: settings.companyAddress || '',
          companyPhone: settings.companyPhone || '',
          companyEmail: settings.companyEmail || '',
          companyWebsite: settings.companyWebsite || '',
        };
        setBranding(updatedBranding);
      } else {
        // 401/403 are expected on public pages (user not logged in)
        if (res.status !== 401 && res.status !== 403) {
          console.warn('Branding fetch failed with status:', res.status);
        }
        setBranding(DEFAULT_BRANDING);
      }
    } catch (e) {
      console.error('Branding fetch error:', e);
      setBranding(DEFAULT_BRANDING);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
    const iv = setInterval(fetchBranding, 30000);
    
    const handleBrandingUpdate = () => {
      fetchBranding();
      setTimeout(fetchBranding, 1000);
    };
    window.addEventListener('branding-updated', handleBrandingUpdate);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'branding-refresh-trigger') fetchBranding();
    };
    window.addEventListener('storage', handleStorageChange);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchBranding();
      else setBranding(DEFAULT_BRANDING);
    });
    
    return () => {
      clearInterval(iv);
      window.removeEventListener('branding-updated', handleBrandingUpdate);
      window.removeEventListener('storage', handleStorageChange);
      subscription.unsubscribe();
    };
  }, [fetchBranding]);

  return (
    <BrandingContext.Provider value={{ branding, refresh: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

/** Helper: generates inline style for gradient background from primary color */
export function brandGradientStyle(color: string) {
  return { background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -30)})` };
}

/** Darken/lighten a hex color */
function adjustColor(hex: string, amount: number): string {
  try {
    const c = hex.replace('#', '');
    const num = parseInt(c, 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch {
    return hex;
  }
}
