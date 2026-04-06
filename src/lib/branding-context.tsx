import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-668731fc`;

export interface CompanyBranding {
  companyName: string;
  description: string;
  primaryColor: string;
  logoUrl: string;
}

const DEFAULT_BRANDING: CompanyBranding = {
  companyName: 'Blumebyte',
  description: 'Human Resource Information System',
  primaryColor: '#10b981',
  logoUrl: '',
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
      // CRITICAL FIX: Use authenticated endpoint to get company-scoped settings
      const token = localStorage.getItem('auth-token');
      if (!token) {
        // If not logged in, use default branding
        setBranding(DEFAULT_BRANDING);
        return;
      }

      const res = await fetch(`${BASE}/company-settings`, {
        headers: { 
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Token': token
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBranding({
          companyName: data.companyName || DEFAULT_BRANDING.companyName,
          description: data.description || DEFAULT_BRANDING.description,
          primaryColor: data.primaryColor || DEFAULT_BRANDING.primaryColor,
          logoUrl: data.logoUrl || '',
        });
      } else {
        // On error, use default branding
        setBranding(DEFAULT_BRANDING);
      }
    } catch (e) {
      console.log('Branding fetch error:', e);
      // On error, keep using default branding - don't block the app
      setBranding(DEFAULT_BRANDING);
    }
  }, []);

  useEffect(() => {
    // Fetch branding in background without blocking initial render
    fetchBranding();
    // PERFORMANCE: Only poll if user is logged in, and reduce frequency to 60 seconds
    const token = localStorage.getItem('auth-token');
    if (!token) return; // Don't poll if not logged in
    
    const iv = setInterval(fetchBranding, 60000); // Reduced from 15s to 60s
    
    // Listen for custom branding update event
    const handleBrandingUpdate = () => {
      console.log('Branding update event received, refreshing...');
      fetchBranding();
    };
    window.addEventListener('branding-updated', handleBrandingUpdate);
    
    return () => {
      clearInterval(iv);
      window.removeEventListener('branding-updated', handleBrandingUpdate);
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