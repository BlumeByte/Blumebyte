import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a35148f0`;

export interface CompanyBranding {
  companyName: string;
  description: string;
  primaryColor: string;
  logoUrl: string;
}

const DEFAULT_BRANDING: CompanyBranding = {
  companyName: 'SAS Finance Group',
  description: 'Human Resource Information System',
  primaryColor: '#1d4ed8',
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
      const res = await fetch(`${BASE}/public/company-branding`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBranding({
          companyName: data.companyName || DEFAULT_BRANDING.companyName,
          description: data.description || DEFAULT_BRANDING.description,
          primaryColor: data.primaryColor || DEFAULT_BRANDING.primaryColor,
          logoUrl: data.logoUrl || '',
        });
      }
    } catch (e) {
      console.log('Branding fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
    const iv = setInterval(fetchBranding, 15000); // poll every 15s for real-time branding sync
    return () => clearInterval(iv);
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