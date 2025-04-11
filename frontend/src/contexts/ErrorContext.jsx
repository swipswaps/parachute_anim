import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import errorHandler, { ErrorSeverity } from '../utils/errorHandler';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

// Create error context
const ErrorContext = createContext(null);

// Error toast component
function ErrorToast({ error, onClose }) {
  // Get icon based on severity
  const getIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.INFO:
        return <Info className="h-4 w-4" />;
      case ErrorSeverity.WARNING:
        return <AlertTriangle className="h-4 w-4" />;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Get variant based on severity
  const getVariant = () => {
    switch (error.severity) {
      case ErrorSeverity.INFO:
        return 'default';
      case ErrorSeverity.WARNING:
        return 'warning';
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get title based on category
  const getTitle = () => {
    switch (error.category) {
      case 'api':
        return 'API Error';
      case 'authentication':
        return 'Authentication Error';
      case 'validation':
        return 'Validation Error';
      case 'network':
        return 'Network Error';
      case 'rendering':
        return 'Rendering Error';
      case 'upload':
        return 'Upload Error';
      default:
        return 'Error';
    }
  };

  // Auto-close after timeout for non-critical errors
  useEffect(() => {
    if (error.severity !== ErrorSeverity.CRITICAL) {
      const timer = setTimeout(() => {
        onClose(error);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  return (
    <Alert variant={getVariant()} className="mb-2">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-2">
          {getIcon()}
        </div>
        <div className="flex-1">
          <AlertTitle>{getTitle()}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </div>
        <button
          className="ml-2 text-gray-400 hover:text-gray-500"
          onClick={() => onClose(error)}
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </Alert>
  );
}

// Error provider component
export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([]);

  // Add error to state
  const addError = useCallback((error) => {
    setErrors((prevErrors) => [...prevErrors, error]);
  }, []);

  // Remove error from state
  const removeError = useCallback((errorToRemove) => {
    setErrors((prevErrors) =>
      prevErrors.filter((error) => error !== errorToRemove)
    );
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Listen for errors from error handler
  useEffect(() => {
    const handleError = (error) => {
      // Only show toasts for warnings, errors, and critical errors
      if (
        error.severity === ErrorSeverity.WARNING ||
        error.severity === ErrorSeverity.ERROR ||
        error.severity === ErrorSeverity.CRITICAL
      ) {
        addError(error);
      }
    };

    errorHandler.addListener(handleError);

    return () => {
      errorHandler.removeListener(handleError);
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    errors,
    addError,
    removeError,
    clearErrors,
    errorHandler,
  }), [errors, addError, removeError, clearErrors]);

  return (
    <ErrorContext.Provider value={value}>
      {children}

      {/* Error toasts */}
      <div className="fixed top-4 right-4 z-50 w-80 space-y-2">
        {errors.map((error, index) => (
          <ErrorToast
            key={`${error.timestamp.getTime()}-${index}`}
            error={error}
            onClose={removeError}
          />
        ))}
      </div>
    </ErrorContext.Provider>
  );
}

// Custom hook to use the error context
export function useError() {
  const context = useContext(ErrorContext);
  if (context === null) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
