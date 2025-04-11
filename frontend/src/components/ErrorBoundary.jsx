import React from 'react';
import { AlertTriangle, RefreshCw, Download, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import errorLoggingService, { SeverityLevel, ErrorCategory } from '../services/errorLoggingService';

/**
 * Enhanced Error Boundary Component
 *
 * A robust error boundary that captures and logs errors, and provides a user-friendly fallback UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isRecovering: false,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our error logging service
    errorLoggingService.logError(error, {
      source: 'error-boundary',
      severity: SeverityLevel.ERROR,
      category: ErrorCategory.RENDERING,
      context: {
        componentStack: errorInfo?.componentStack,
        component: this.props.componentName || 'unknown',
      },
    });

    this.setState({ errorInfo });
  }

  /**
   * Attempt to recover from the error
   */
  handleRecovery = () => {
    this.setState(prevState => ({
      isRecovering: true,
      recoveryAttempts: prevState.recoveryAttempts + 1,
    }));

    // Log recovery attempt
    errorLoggingService.logInfo('Attempting to recover from error', {
      source: 'error-boundary',
      context: {
        recoveryAttempts: this.state.recoveryAttempts + 1,
        error: this.state.error?.message,
      },
    });

    // Wait a moment before attempting recovery
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
      });
    }, 1000);
  };

  /**
   * Refresh the page
   */
  handleRefresh = () => {
    window.location.reload();
  };

  /**
   * Toggle error details visibility
   */
  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  /**
   * Copy error details to clipboard
   */
  copyErrorDetails = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = [
      `Error: ${error?.message || 'Unknown error'}`,
      `Stack: ${error?.stack || 'No stack trace available'}`,
      `Component Stack: ${errorInfo?.componentStack || 'No component stack available'}`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
    ].join('\n');

    navigator.clipboard.writeText(errorDetails).then(
      () => {
        // Show a temporary success message
        const button = document.getElementById('copy-error-button');
        if (button) {
          const originalText = button.innerText;
          button.innerText = 'Copied!';
          setTimeout(() => {
            button.innerText = originalText;
          }, 2000);
        }
      },
      (err) => {
        console.error('Could not copy error details:', err);
      }
    );
  };

  /**
   * Download error details as a file
   */
  downloadErrorDetails = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = [
      `Error: ${error?.message || 'Unknown error'}`,
      `Stack: ${error?.stack || 'No stack trace available'}`,
      `Component Stack: ${errorInfo?.componentStack || 'No component stack available'}`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
    ].join('\n');

    const blob = new Blob([errorDetails], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  render() {
    const { hasError, error, errorInfo, showDetails, isRecovering, recoveryAttempts } = this.state;
    const { fallback, componentName } = this.props;

    // If there's no error, render children
    if (!hasError) {
      return this.props.children;
    }

    // If a custom fallback is provided, use it
    if (fallback) {
      return fallback({
        error,
        errorInfo,
        reset: this.handleRecovery,
        componentName,
      });
    }

    // Otherwise, render our default fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center text-red-500 mb-4">
            <AlertTriangle className="h-8 w-8 mr-2" />
            <h2 className="text-xl font-bold">Something went wrong</h2>
          </div>

          <p className="text-gray-600 mb-4">
            {componentName
              ? `The ${componentName} component encountered an error.`
              : 'The application encountered an unexpected error.'}
            {recoveryAttempts === 0
              ? ' You can try to recover without refreshing the page.'
              : ' Please try refreshing the page if the error persists.'}
          </p>

          <div className="mb-4">
            <button
              onClick={this.toggleDetails}
              className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide error details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show error details
                </>
              )}
            </button>

            {showDetails && (
              <div className="mt-2">
                <div className="bg-gray-100 p-4 rounded overflow-auto text-sm mb-2 max-h-40">
                  <p className="font-mono text-red-600">{error?.message || 'Unknown error'}</p>
                  {error?.stack && (
                    <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap">
                      {error.stack.split('\n').slice(1).join('\n')}
                    </pre>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    id="copy-error-button"
                    onClick={this.copyErrorDetails}
                    className="text-xs flex items-center text-gray-600 hover:text-gray-800"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy details
                  </button>

                  <button
                    onClick={this.downloadErrorDetails}
                    className="text-xs flex items-center text-gray-600 hover:text-gray-800"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download details
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={this.handleRecovery}
              disabled={isRecovering || recoveryAttempts >= 3}
              className={`flex-1 flex justify-center items-center py-2 px-4 rounded transition-colors ${isRecovering || recoveryAttempts >= 3
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Recovering...
                </>
              ) : recoveryAttempts >= 3 ? (
                'Too many attempts'
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try to recover
                </>
              )}
            </button>

            <button
              onClick={this.handleRefresh}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
