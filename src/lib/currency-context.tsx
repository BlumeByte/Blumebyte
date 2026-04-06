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
        // Get user's company settings
        const employee = await api(`/employees/${user.id}`, { token: accessToken });
        const companyId = employee?.companyId || employee?.company;

        if (companyId) {
          // Get company settings
          const company = await api(`/companies/${companyId}`, { token: accessToken });
          
          if (company?.currency) {
            const curr = CURRENCIES.find(c => c.code === company.currency);
            if (curr) {
              setCurrencyCode(curr.code);
              setCurrencySymbol(curr.symbol);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load currency settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrency();
  }, [accessToken, user?.id]);

  // Update currency (SuperAdmin only)
  const updateCurrency = async (code: string) => {
    if (!accessToken || !user?.id) return;

    try {
      const curr = CURRENCIES.find(c => c.code === code);
      if (!curr) throw new Error('Invalid currency code');

      // Get user's company
      const employee = await api(`/employees/${user.id}`, { token: accessToken });
      const companyId = employee?.companyId || employee?.company;

      if (!companyId) throw new Error('No company found');

      // Update company settings
      await api(`/companies/${companyId}`, {
        method: 'PUT',
        body: { currency: code },
        token: accessToken,
      });

      // Update local state
      setCurrencyCode(curr.code);
      setCurrencySymbol(curr.symbol);

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
