import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { api } from './api-client';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
];

interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  setCurrency: (code: string) => Promise<void>;
  formatCurrency: (amount: number | string) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [loading, setLoading] = useState<boolean>(true);

  // Load currency from tenant's company settings
  useEffect(() => {
    const loadCurrency = async () => {
      if (!accessToken || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get company settings directly (includes currency)
        const settings = await api('/company-settings', { token: accessToken });
        
        if (settings?.currencyCode && settings?.currencySymbol) {
          // Use currency from company settings (supports custom currencies)
          setCurrencyCode(settings.currencyCode);
          setCurrencySymbol(settings.currencySymbol);
        } else {
          // Fallback to default USD
          setCurrencyCode('USD');
          setCurrencySymbol('$');
        }
      } catch (error) {
        console.error('Failed to load currency settings:', error);
        // Use default on error
        setCurrencyCode('USD');
        setCurrencySymbol('$');
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, [accessToken, user?.id]);

  // Update currency (SuperAdmin only)
  const updateCurrency = async (code: string, customSymbol?: string) => {
    if (!accessToken || !user?.id) return;

    try {
      // For standard currencies, find from CURRENCIES list
      const curr = CURRENCIES.find(c => c.code === code);
      
      // Update local state
      if (curr) {
        setCurrencyCode(curr.code);
        setCurrencySymbol(curr.symbol);
      } else if (customSymbol) {
        // Custom currency
        setCurrencyCode(code);
        setCurrencySymbol(customSymbol);
      }

      // Trigger event to refresh all components
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: code } }));
    } catch (error) {
      console.error('Failed to update currency:', error);
      throw error;
    }
  };

  // Format currency with proper symbol and locale
  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return `${currencySymbol}0.00`;

    const formatted = numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${currencySymbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencyCode,
        currencySymbol,
        setCurrency: updateCurrency,
        formatCurrency,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
