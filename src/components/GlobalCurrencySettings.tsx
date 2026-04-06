import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { useCurrency, CURRENCIES } from '../lib/currency-context';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { DollarSign, Save, Loader2, Info, Sparkles } from 'lucide-react';

export function GlobalCurrencySettings() {
  const { accessToken, user } = useAuth();
  const { currencyCode, setCurrency: updateCurrency, loading: currencyLoading } = useCurrency();
  const [currency, setCurrency] = useState(currencyCode);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [useCustomCurrency, setUseCustomCurrency] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');

  useEffect(() => {
    setCurrency(currencyCode);
  }, [currencyCode]);

  useEffect(() => {
    const loadCompanyData = async () => {
      if (!accessToken || !user?.id) return;
      try {
        // Get company ID from employee record
        const employee = await api(`/employees/${user.id}`, { token: accessToken });
        const cId = employee?.companyId || employee?.company;
        setCompanyId(cId);

        // Check if current currency is custom
        const settings = await api('/company-settings', { token: accessToken });
        if (settings?.isCustomCurrency) {
          setUseCustomCurrency(true);
          setCustomCode(settings.currencyCode || '');
          setCustomSymbol(settings.currencySymbol || '');
        }
      } catch (error) {
        console.error('Failed to load company data:', error);
      }
    };
    loadCompanyData();
  }, [accessToken, user?.id]);

  const handleSave = async () => {
    if (!companyId) {
      toast.error('No company found. Please contact support.');
      return;
    }

    // Validate custom currency if enabled
    if (useCustomCurrency) {
      if (!customCode || !customSymbol) {
        toast.error('Please enter both currency code and symbol');
        return;
      }
      if (customCode.length > 5) {
        toast.error('Currency code must be 5 characters or less');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        currency: useCustomCurrency ? null : currency,
      };

      if (useCustomCurrency) {
        payload.customCurrencyCode = customCode;
        payload.customCurrencySymbol = customSymbol;
      }

      const response = await api(`/companies/${companyId}/currency`, {
        method: 'PUT',
        body: payload,
        token: accessToken,
      });

      // Update local currency context
      if (useCustomCurrency) {
        await updateCurrency(customCode);
      } else {
        await updateCurrency(currency);
      }
      
      toast.success(`✅ Currency updated successfully!`);
      
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
        {/* Custom Currency Toggle */}
        <div className="flex items-center space-x-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <Checkbox
            id="custom-currency"
            checked={useCustomCurrency}
            onCheckedChange={(checked) => setUseCustomCurrency(checked as boolean)}
          />
          <Label htmlFor="custom-currency" className="cursor-pointer flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Use Custom Currency</span>
            <span className="text-xs text-gray-500">(if your currency isn't listed)</span>
          </Label>
        </div>

        {!useCustomCurrency ? (
          // Standard Currency Selection
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
        ) : (
          // Custom Currency Input
          <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-2 mb-4">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                Enter your custom currency details. Example: Code: "BTC", Symbol: "₿" or Code: "FCFA", Symbol: "₣"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency Code <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g., BTC, FCFA, XOF"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  maxLength={5}
                />
                <p className="text-xs text-gray-500">Max 5 characters</p>
              </div>

              <div className="space-y-2">
                <Label>Currency Symbol <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g., ₿, ₣, £"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  maxLength={5}
                />
                <p className="text-xs text-gray-500">Special symbol or letters</p>
              </div>
            </div>

            {customCode && customSymbol && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  Preview: <strong>{customSymbol} 1,000.00 {customCode}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Selected Currency Preview */}
        {!useCustomCurrency && selectedCurrency && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Selected Currency</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Code:</span>{' '}
                <span className="font-medium">{selectedCurrency.code}</span>
              </div>
              <div>
                <span className="text-gray-600">Symbol:</span>{' '}
                <span className="font-medium text-lg">{selectedCurrency.symbol}</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {selectedCurrency.name}
            </p>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={loading || (!useCustomCurrency && !currency) || (useCustomCurrency && (!customCode || !customSymbol))}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Currency Settings...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Currency Settings
            </>
          )}
        </Button>

        {/* Multi-Tenant Info */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>🔒 Multi-Tenant Isolation:</strong> This currency change only affects users in your company. 
            Other tenants maintain their own currency settings.
          </p>
        </div>
      </div>
    </div>
  );
}
