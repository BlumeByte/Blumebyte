/**
 * Currency Utility - Tenant-Specific Currency Formatting
 * 
 * This utility provides currency formatting that respects each tenant's
 * currency settings. All components should use these functions instead
 * of hardcoding $ or other currency symbols.
 * 
 * Usage:
 * ```tsx
 * import { useCurrency } from '../lib/currency-context';
 * 
 * function MyComponent() {
 *   const { formatCurrency, currencySymbol, currencyCode } = useCurrency();
 *   
 *   return <div>{formatCurrency(1000)} // Returns: $1,000.00 or ₦1,000.00 etc</div>
 * }
 * ```
 */

export { useCurrency, CurrencyProvider, CURRENCIES } from './currency-context';

/**
 * Quick currency formatter (requires context)
 * Use this for inline formatting in JSX
 */
export function formatAmount(amount: number | string, symbol: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `${symbol}0.00`;

  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
}

/**
 * Legacy function for components still using localStorage
 * @deprecated Use useCurrency() hook instead for tenant-specific currency
 */
export function getLegacyCurrencySymbol(): string {
  return localStorage.getItem('global_currency_symbol') || '$';
}

/**
 * Legacy function for components still using localStorage
 * @deprecated Use useCurrency() hook instead for tenant-specific currency
 */
export function getLegacyCurrencyCode(): string {
  return localStorage.getItem('global_currency') || 'USD';
}
