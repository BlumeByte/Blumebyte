import * as React from 'react';
import { RouterProvider } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './routes';
import { Analytics } from '@vercel/analytics/react';

function App() {
  // Suppress Figma iframe errors in console (development only)
  React.useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      
      // Filter out known Figma iframe errors and dynamic import errors
      if (
        message.includes('IframeMessageAbortError') ||
        message.includes('message port was destroyed') ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('/src/App.tsx')
      ) {
        return; // Suppress these errors
      }
      
      // Log all other errors normally
      originalError.apply(console, args);
    };

    // Global error handler for unhandled errors
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (
        message.includes('IframeMessageAbortError') ||
        message.includes('message port was destroyed') ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('/src/App.tsx')
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.toString() || '';
      if (
        message.includes('IframeMessageAbortError') ||
        message.includes('message port was destroyed') ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('/src/App.tsx')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;