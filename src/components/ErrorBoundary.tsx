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
    
    // Ignore iframe/ESM hot reload errors
    if (
      errorMessage.includes('IframeMessageAbortError') ||
      errorMessage.includes('message port was destroyed') ||
      errorMessage.includes('esm.sh')
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
      !errorMessage.includes('esm.sh')
    ) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer font-medium mb-2">Error details</summary>
                <pre className="bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
