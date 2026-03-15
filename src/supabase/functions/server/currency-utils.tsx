// Currency conversion utilities for Paystack payments
// Supports GHS (Ghana Cedis), NGN (Nigerian Naira), and USD

interface ExchangeRateCache {
  rates: Record<string, number>;
  timestamp: number;
}

let cachedRates: ExchangeRateCache | null = null;
const CACHE_DURATION = 3600000; // 1 hour

/**
 * Fetches all USD exchange rates (cached for 1 hour)
 */
async function getAllRates(): Promise<Record<string, number>> {
  if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
    return cachedRates.rates;
  }

  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    const data = await response.json();
    if (!data.rates || typeof data.rates !== 'object') throw new Error('Invalid exchange rate data');

    cachedRates = { rates: data.rates, timestamp: Date.now() };
    console.log('Exchange rates fetched. GHS:', data.rates.GHS, 'NGN:', data.rates.NGN);
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Fallback rates as of March 2026 (approximate)
    const fallback = { GHS: 15.5, NGN: 1600, USD: 1 };
    console.warn('Using fallback exchange rates:', fallback);
    return fallback;
  }
}

/**
 * Returns the Paystack currency to use.
 * Reads PAYSTACK_CURRENCY env var; defaults to 'GHS'.
 * Supported: 'GHS', 'NGN', 'USD'
 */
export function getPaystackCurrency(): string {
  const currency = Deno.env.get('PAYSTACK_CURRENCY') || 'GHS';
  const supported = ['GHS', 'NGN', 'USD'];
  if (!supported.includes(currency.toUpperCase())) {
    console.warn(`Unsupported PAYSTACK_CURRENCY "${currency}", defaulting to GHS`);
    return 'GHS';
  }
  return currency.toUpperCase();
}

/**
 * Converts a USD amount to the configured Paystack currency,
 * returned in the currency's smallest unit (pesewas, kobo, cents).
 */
export async function usdToPaystackAmount(usdAmount: number): Promise<{ amountSmallestUnit: number; amountDisplay: number; currency: string }> {
  const currency = getPaystackCurrency();
  const rates = await getAllRates();

  let amountDisplay: number;

  if (currency === 'USD') {
    amountDisplay = usdAmount;
  } else {
    const rate = rates[currency];
    if (!rate) throw new Error(`Exchange rate not found for ${currency}`);
    amountDisplay = Math.round(usdAmount * rate * 100) / 100;
  }

  // All Paystack currencies use ×100 for smallest unit (pesewas, kobo, cents)
  const amountSmallestUnit = Math.round(amountDisplay * 100);

  console.log(`USD ${usdAmount} → ${currency} ${amountDisplay} (${amountSmallestUnit} smallest units)`);

  return { amountSmallestUnit, amountDisplay, currency };
}

// ── Legacy exports kept for backward compatibility ──────────────────────────

export async function getUsdToGhsRate(): Promise<number> {
  const rates = await getAllRates();
  return rates.GHS ?? 15.5;
}

export async function convertUsdToGhs(usdAmount: number): Promise<number> {
  const rate = await getUsdToGhsRate();
  return Math.round(usdAmount * rate * 100) / 100;
}

export function ghsToPesewas(ghsAmount: number): number {
  return Math.round(ghsAmount * 100);
}

export async function usdToPesewas(usdAmount: number): Promise<number> {
  const ghsAmount = await convertUsdToGhs(usdAmount);
  return ghsToPesewas(ghsAmount);
}
