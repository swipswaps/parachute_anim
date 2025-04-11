/**
 * Global error handling utility
 */

// Error severity levels
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// Error categories
export const ErrorCategory = {
  API: 'api',
  AUTHENTICATION: 'authentication',
  VALIDATION: 'validation',
  NETWORK: 'network',
  RENDERING: 'rendering',
  UPLOAD: 'upload',
  UNKNOWN: 'unknown',
};

// Error handler class
class ErrorHandler {
  constructor() {
    this.listeners = [];
    this.errorHistory = [];
    this.maxHistorySize = 50;
  }

  /**
   * Add an error listener
   * @param {Function} listener - The listener function
   */
  addListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Remove an error listener
   * @param {Function} listener - The listener function to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Handle an error
   * @param {Error|Object} error - The error object
   * @param {string} category - The error category
   * @param {string} severity - The error severity
   * @param {Object} metadata - Additional metadata about the error
   */
  handleError(error, category = ErrorCategory.UNKNOWN, severity = ErrorSeverity.ERROR, metadata = {}) {
    // Create error record
    const errorRecord = {
      timestamp: new Date(),
      message: error.message || String(error),
      stack: error.stack,
      category,
      severity,
      metadata,
      originalError: error,
    };

    // Add to history
    this.errorHistory.unshift(errorRecord);
    
    // Trim history if needed
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}] [${category}] ${errorRecord.message}`, {
        error,
        metadata,
      });
    }

    // Notify listeners
    this.notifyListeners(errorRecord);

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTrackingService(errorRecord);
    }

    return errorRecord;
  }

  /**
   * Notify all listeners about an error
   * @param {Object} errorRecord - The error record
   */
  notifyListeners(errorRecord) {
    this.listeners.forEach(listener => {
      try {
        listener(errorRecord);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Send error to an error tracking service
   * @param {Object} errorRecord - The error record
   */
  sendToErrorTrackingService(errorRecord) {
    // This would be implemented with a service like Sentry, LogRocket, etc.
    // For now, we'll just log to console
    console.log('Would send to error tracking service:', errorRecord);
  }

  /**
   * Get error history
   * @param {number} limit - Maximum number of errors to return
   * @returns {Array} - Array of error records
   */
  getErrorHistory(limit = this.maxHistorySize) {
    return this.errorHistory.slice(0, limit);
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * Handle API errors
   * @param {Error} error - The API error
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - The error record
   */
  handleApiError(error, metadata = {}) {
    const apiError = {
      message: error.response?.data?.message || error.message || 'API request failed',
      status: error.response?.status,
      data: error.response?.data,
      endpoint: metadata.endpoint || 'unknown',
    };

    return this.handleError(
      error,
      ErrorCategory.API,
      this.getSeverityFromStatus(error.response?.status),
      { ...metadata, apiError }
    );
  }

  /**
   * Get severity based on HTTP status code
   * @param {number} status - HTTP status code
   * @returns {string} - Error severity
   */
  getSeverityFromStatus(status) {
    if (!status) return ErrorSeverity.ERROR;

    if (status >= 500) return ErrorSeverity.ERROR;
    if (status >= 400) return ErrorSeverity.WARNING;
    return ErrorSeverity.INFO;
  }

  /**
   * Handle network errors
   * @param {Error} error - The network error
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - The error record
   */
  handleNetworkError(error, metadata = {}) {
    return this.handleError(
      error,
      ErrorCategory.NETWORK,
      ErrorSeverity.WARNING,
      metadata
    );
  }

  /**
   * Handle authentication errors
   * @param {Error} error - The authentication error
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - The error record
   */
  handleAuthError(error, metadata = {}) {
    return this.handleError(
      error,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.WARNING,
      metadata
    );
  }

  /**
   * Handle validation errors
   * @param {Error|Object} error - The validation error
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - The error record
   */
  handleValidationError(error, metadata = {}) {
    return this.handleError(
      error,
      ErrorCategory.VALIDATION,
      ErrorSeverity.INFO,
      metadata
    );
  }

  /**
   * Handle rendering errors
   * @param {Error} error - The rendering error
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - The error record
   */
  handleRenderingError(error, metadata = {}) {
    return this.handleError(
      error,
      ErrorCategory.RENDERING,
      ErrorSeverity.ERROR,
      metadata
    );
  }

  /**
   * Handle upload errors
   * @param {Error} error - The upload error
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - The error record
   */
  handleUploadError(error, metadata = {}) {
    return this.handleError(
      error,
      ErrorCategory.UPLOAD,
      ErrorSeverity.WARNING,
      metadata
    );
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

export default errorHandler;
