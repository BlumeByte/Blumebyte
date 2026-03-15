import * as React from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './lib/auth-context';
import { BrandingProvider } from './lib/branding-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EmployeeChat } from './components/EmployeeChat';
import { router } from './routes';

function App() {
  return (
    <ErrorBoundary>
      <BrandingProvider>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          <EmployeeChat />
          <RouterProvider router={router} />
        </AuthProvider>
      </BrandingProvider>
    </ErrorBoundary>
  );
}

export default App;