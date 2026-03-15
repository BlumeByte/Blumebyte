import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── IFRAME DETECTION & ADAPTATION ──────────────────────────────────
const isInIframe = window.self !== window.top;
const isFigmaPreview = isInIframe && (
  document.referrer.includes('figma.com') || 
  window.location.ancestorOrigins?.[0]?.includes('figma.com')
);

if (isFigmaPreview) {
  console.log('🎨 Detected Figma preview environment');
}

// ── MAXIMUM STRENGTH Console Warning Suppressor ────────────────────
// Blocks ALL Figma inspector warnings (_fg*) at every possible level

// Save originals
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Aggressive pattern matching
const shouldSuppress = (...args: any[]): boolean => {
  const message = String(args[0] || '');
  
  // Block defaultProps warnings
  if (message.includes('defaultProps')) return true;
  
  // Block ANY mention of _fg props (case insensitive)
  if (/_fg/i.test(message)) return true;
  if (message.includes('React does not recognize')) return true;
  
  return false;
};

// Override console methods BEFORE React loads
console.error = (...args: any[]) => {
  if (shouldSuppress(...args)) return;
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (shouldSuppress(...args)) return;
  originalConsoleWarn.apply(console, args);
};

// Enhanced error handling for production
let initializationFailed = false;

window.onerror = (message, source, lineno, colno, error) => {
  // Allow suppressed warnings to pass through
  if (typeof message === 'string' && shouldSuppress(message)) {
    return true;
  }
  
  // Log actual errors
  originalConsoleError('Global error:', message, 'at', source, lineno, colno, error);
  
  // If the app hasn't rendered yet, show a user-friendly error
  if (!initializationFailed) {
    initializationFailed = true;
    showInitializationError(String(message));
  }
  
  return false;
};

window.onunhandledrejection = (event) => {
  if (event.reason && shouldSuppress(String(event.reason))) {
    event.preventDefault();
    return;
  }
  
  originalConsoleError('Unhandled promise rejection:', event.reason);
  
  if (!initializationFailed) {
    initializationFailed = true;
    showInitializationError(`Promise rejection: ${event.reason}`);
  }
};

function showInitializationError(errorMessage: string) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="
          max-width: 600px;
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        ">
          <div style="
            width: 80px;
            height: 80px;
            background: #ef4444;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
          ">⚠️</div>
          
          <h1 style="
            color: #1f2937;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 15px;
          ">App Initialization Failed</h1>
          
          <p style="
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 25px;
          ">The application encountered an error during startup. Please try refreshing the page or contact support if the problem persists.</p>
          
          <details style="
            background: #f3f4f6;
            border-radius: 8px;
            padding: 15px;
            text-align: left;
            margin-bottom: 25px;
            cursor: pointer;
          ">
            <summary style="
              font-weight: 600;
              color: #374151;
              margin-bottom: 10px;
            ">Technical Details</summary>
            <pre style="
              font-size: 12px;
              color: #ef4444;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-word;
              margin: 0;
            ">${errorMessage}</pre>
          </details>
          
          <button onclick="window.location.reload()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            margin-right: 10px;
            transition: all 0.2s;
          ">🔄 Reload Page</button>
          
          <button onclick="window.location.href='/debug.html'" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s;
          ">🔧 Debug Tools</button>
        </div>
      </div>
    `;
  }
}

// Attempt to render the app with error catching
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  console.log('🚀 Initializing React app...');
  console.log('📦 Root element found:', rootElement);
  console.log('🌐 Environment:', {
    isIframe: window.self !== window.top,
    referrer: document.referrer,
    location: window.location.href,
  });
  
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
  
  console.log('✅ React app initialized successfully');
  
  // Mark initialization as successful after a brief delay
  setTimeout(() => {
    const root = document.getElementById('root');
    if (root && root.children.length > 0) {
      console.log('✓ App rendered successfully');
      console.log('📊 Root has', root.children.length, 'children');
    } else {
      console.error('✗ App initialized but did not render');
      console.error('Root innerHTML:', root?.innerHTML);
    }
  }, 1000);
  
} catch (error) {
  console.error('❌ Failed to initialize app:', error);
  initializationFailed = true;
  showInitializationError(error instanceof Error ? error.message : String(error));
}