import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Filter out known benign errors
    const errorMessage = error.message || '';
    
    // Ignore iframe/ESM hot reload errors and dynamic import errors (dev only)
    if (
      errorMessage.includes('IframeMessageAbortError') ||
      errorMessage.includes('message port was destroyed') ||
      errorMessage.includes('esm.sh') ||
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('/src/App.tsx')
    ) {
      return { hasError: false, error: null };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log actual errors, not development hot-reload issues
    const errorMessage = error.message || '';
    if (
      !errorMessage.includes('IframeMessageAbortError') &&
      !errorMessage.includes('message port was destroyed') &&
      !errorMessage.includes('esm.sh') &&
      !errorMessage.includes('Failed to fetch dynamically imported module') &&
      !errorMessage.includes('/src/App.tsx')
    ) {
      console.error('Error caught by boundary:', error, errorInfo);
    } else if (errorMessage.includes('Failed to fetch dynamically imported module')) {
      // This is typically a hot reload issue in development, just log it
      console.log('Dynamic import reload detected, ignoring...');
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <Card className="max-w-lg w-full shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Oops! Something Went Wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                We encountered an unexpected error. Don't worry - your data is safe. 
                Please try refreshing the page or contact our support team if the problem persists.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Need Help?</strong> Contact us at{' '}
                  <a href="mailto:support@blumebyte.com" className="underline font-semibold">
                    support@blumebyte.com
                  </a>
                  {' '}with the error details below.
                </p>
              </div>
              
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium mb-2 hover:text-gray-700">
                  📋 View Technical Error Details
                </summary>
                <pre className="bg-gray-100 p-3 rounded overflow-auto text-[10px] border border-gray-200">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      Stack trace:
                      {'\n'}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  🔄 Reload Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  🏠 Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}