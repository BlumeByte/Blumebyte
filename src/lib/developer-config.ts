const readEnvString = (value: string | undefined, fallback: string): string => {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
};

export const LANDING_DASHBOARD_PREVIEW_URL = readEnvString(
  import.meta.env.VITE_LANDING_DASHBOARD_PREVIEW_URL,
  'hr.blumebyte.com/dashboard',
);

export const LANDING_CONTACT_URL = readEnvString(
  import.meta.env.VITE_LANDING_CONTACT_URL,
  'https://blumebyte.com/contact/',
);

export const LANDING_PRICING_ANNUAL_PRICE = readEnvString(
  import.meta.env.VITE_LANDING_PRICING_ANNUAL_PRICE,
  '$2.55',
);

export const LANDING_PRICING_MONTHLY_PRICE = readEnvString(
  import.meta.env.VITE_LANDING_PRICING_MONTHLY_PRICE,
  '$3.55',
);

export const LANDING_PRICING_ANNUAL_BILLING_CYCLE = readEnvString(
  import.meta.env.VITE_LANDING_PRICING_ANNUAL_BILLING_CYCLE,
  'Billed annually ($30.60/year)',
);

export const LANDING_PRICING_MONTHLY_BILLING_CYCLE = readEnvString(
  import.meta.env.VITE_LANDING_PRICING_MONTHLY_BILLING_CYCLE,
  'Billed monthly',
);
