import * as React from 'react';
import { RouterProvider } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './routes';

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;