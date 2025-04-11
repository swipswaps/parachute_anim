import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Import i18n
import './i18n/i18n';

// Add global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Display error on page for debugging
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  errorDiv.style.padding = '20px';
  errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  errorDiv.style.color = 'white';
  errorDiv.style.zIndex = '9999';
  errorDiv.innerHTML = `<strong>Error:</strong> ${event.error?.message || 'Unknown error'}<br><pre>${event.error?.stack || ''}</pre>`;
  document.body.appendChild(errorDiv);
});

// Add handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Display error on page for debugging
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  errorDiv.style.padding = '20px';
  errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  errorDiv.style.color = 'white';
  errorDiv.style.zIndex = '9999';
  errorDiv.innerHTML = `<strong>Unhandled Promise Rejection:</strong> ${event.reason?.message || 'Unknown error'}<br><pre>${event.reason?.stack || ''}</pre>`;
  document.body.appendChild(errorDiv);
});

// Import self-correcting logic
import { initializeSelfCorrection, cleanupSelfCorrection } from './utils/appInitializer';
import { startVerification, stopVerification } from './utils/pageLoadVerifier';

// Initialize self-correcting logic asynchronously
initializeSelfCorrection().then(result => {
  console.log('Self-correction initialization results:', result);

  // Start page load verification after initialization
  setTimeout(() => {
    startVerification();
  }, 1000);
}).catch(error => {
  console.error('Error initializing self-correction:', error);

  // Start page load verification even if initialization fails
  setTimeout(() => {
    startVerification();
  }, 1000);
});

// Clean up self-correcting logic on unmount
window.addEventListener('beforeunload', () => {
  cleanupSelfCorrection();
  stopVerification();
});

// Add a global error boundary for the application
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-500 rounded-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{this.state.error?.message || 'An unknown error occurred'}</p>
          <button
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <App />
      </Suspense>
    </GlobalErrorBoundary>
  </React.StrictMode>
)
