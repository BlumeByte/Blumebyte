import { useState, useEffect, type ReactNode } from 'react';

interface ClientOnlyChartProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component to ensure Recharts only renders on the client side.
 * This prevents SSR/hydration issues that cause charts to not display in production.
 */
export function ClientOnlyChart({ children, fallback = null }: ClientOnlyChartProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
