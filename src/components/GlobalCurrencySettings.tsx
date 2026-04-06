import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { useCurrency, CURRENCIES } from '../lib/currency-context';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { DollarSign, Save, Loader2 } from 'lucide-react';

export function GlobalCurrencySettings() {
  const { accessToken, user } = useAuth();
  const { currencyCode, setCurrency: updateCurrency, loading: currencyLoading } = useCurrency();
  const [currency, setCurrency] = useState(currencyCode);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    setCurrency(currencyCode);
  }, [currencyCode]);

  useEffect(() => {
    const loadCompanyId = async () => {
      if (!accessToken || !user?.id) return;
      try {
        const employee = await api(`/employees/${user.id}`, { token: accessToken });
        setCompanyId(employee?.companyId || employee?.company);
      } catch (error) {
        console.error('Failed to load company ID:', error);
      }
    };
    loadCompanyId();
  }, [accessToken, user?.id]);

  const handleSave = async () => {
    if (!companyId) {
      toast.error('No company found');
      return;
    }

    setLoading(true);
    try {
      await api(`/companies/${companyId}/currency`, {
        method: 'PUT',
        body: { currency },
        token: accessToken,
      });

      await updateCurrency(currency);
      
      toast.success(`Currency updated to ${currency}`);
      
      // Reload to apply changes everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error saving currency:', error);
      toast.error(error.message || 'Failed to save currency');
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  if (currencyLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>🏢 Tenant-Specific Currency</strong>
          <br />
          This currency will be used across all modules and users <strong>in your company only</strong>. Other companies will see their own currency settings.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} - {curr.name} ({curr.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCurrency && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Selected Currency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedCurrency.symbol} {selectedCurrency.code}
                </p>
                <p className="text-xs text-gray-500">{selectedCurrency.name}</p>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={loading || currency === currencyCode} 
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Currency Settings
            </>
          )}
        </Button>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>⚡ Multi-Tenant Isolation:</strong> This currency change only affects users in your company. Other tenants maintain their own currency settings.
          </p>
        </div>
      </div>
    </div>
  );
}

// Legacy helper functions for backward compatibility
export function getCurrencySymbol(): string {
  return localStorage.getItem('global_currency_symbol') || '$';
}

export function getCurrencyCode(): string {
  return localStorage.getItem('global_currency') || 'USD';
}

export function formatCurrency(amount: number): string {
  const symbol = getCurrencySymbol();
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}
