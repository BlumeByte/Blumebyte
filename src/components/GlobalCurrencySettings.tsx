import React, { useState, useEffect } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { DollarSign, Save } from 'lucide-react';

const CURRENCIES = [
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

export function GlobalCurrencySettings() {
  const [currency, setCurrency] = useState(localStorage.getItem('global_currency') || 'USD');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    try {
      localStorage.setItem('global_currency', currency);
      const selectedCurrency = CURRENCIES.find(c => c.code === currency);
      if (selectedCurrency) {
        localStorage.setItem('global_currency_symbol', selectedCurrency.symbol);
      }
      toast.success(`Currency updated to ${currency}`);
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency } }));
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving currency:', error);
      toast.error('Failed to save currency');
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Global Currency Setting</strong>
          <br />
          This currency will be used across all modules, companies, and users in the system. All monetary values will be displayed with this currency symbol.
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

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Currency Settings'}
        </Button>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Changing the currency will reload the application to apply changes across all modules. All users will see monetary values in the selected currency.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to get the current currency symbol
export function getCurrencySymbol(): string {
  return localStorage.getItem('global_currency_symbol') || '$';
}

// Helper function to get the current currency code
export function getCurrencyCode(): string {
  return localStorage.getItem('global_currency') || 'USD';
}

// Helper function to format amount with currency
export function formatCurrency(amount: number): string {
  const symbol = getCurrencySymbol();
  const code = getCurrencyCode();
  
  // Format with commas
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol}${formatted}`;
}
