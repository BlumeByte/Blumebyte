import { useEffect, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ClientOnlyChartProps {
  children?: ReactNode;
  fallback?: ReactNode;
  type?: 'bar' | 'line' | 'pie';
  data?: any[];
  xKey?: string;
  yKeys?: Array<{ key: string; name?: string; color?: string }>;
  height?: number;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function ConfiguredChart({ type, data = [], xKey = 'name', yKeys = [], height = 300 }: ClientOnlyChartProps) {
  if (!type) return null;

  const series = yKeys.length > 0 ? yKeys : [{ key: 'value', name: 'Value', color: CHART_COLORS[0] }];

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={data} dataKey="value" nameKey="name" outerRadius="75%">
            {data.map((entry, index) => (
              <Cell key={`${entry?.name || 'slice'}-${index}`} fill={entry?.fill || CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {series.map((item, index) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name || item.key}
              stroke={item.color || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {series.map((item, index) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.name || item.key}
            fill={item.color || CHART_COLORS[index % CHART_COLORS.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Wrapper component to ensure Recharts only renders on the client side.
 * This prevents SSR/hydration issues that cause charts to not display in production.
 */
export function ClientOnlyChart(props: ClientOnlyChartProps) {
  const { children, fallback = null } = props;
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  if (children) {
    return <>{children}</>;
  }

  return <ConfiguredChart {...props} />;
}
