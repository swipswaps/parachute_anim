/**
 * Error Logging Service
 * 
 * A production-ready error logging service that follows industry best practices.
 */

// Configuration
const DEFAULT_CONFIG = {
  // Whether to log errors to the console
  logToConsole: true,
  
  // Whether to log errors to the server
  logToServer: true,
  
  // The URL of the error logging endpoint
  logEndpoint: '/api/log/error',
  
  // Whether to log errors to local storage
  logToLocalStorage: true,
  
  // The maximum number of errors to store in local storage
  maxLocalStorageErrors: 100,
  
  // The local storage key for errors
  localStorageKey: 'app_error_log',
  
  // Whether to include user context in error logs
  includeUserContext: true,
  
  // Whether to include browser information in error logs
  includeBrowserInfo: true,
  
  // Whether to include application state in error logs
  includeAppState: true,
  
  // The maximum number of errors to batch before sending
  maxBatchSize: 10,
  
  // The maximum time to wait before sending a batch (in milliseconds)
  maxBatchWait: 5000,
  
  // The number of retry attempts for failed transmissions
  maxRetries: 3,
  
  // The delay between retry attempts (in milliseconds)
  retryDelay: 1000,
  
  // The sample rate for errors (1.0 = log all errors, 0.5 = log 50% of errors)
  sampleRate: 1.0,
  
  // The minimum severity level to log (debug, info, warning, error, critical)
  minSeverity: 'info',
  
  // Whether to deduplicate similar errors
  deduplicate: true,
  
  // The maximum number of duplicate errors to log
  maxDuplicates: 5,
};

// Severity levels
const SeverityLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// Error categories
const ErrorCategory = {
  NETWORK: 'network',
  API: 'api',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  RENDERING: 'rendering',
  PERFORMANCE: 'performance',
  DEPENDENCY: 'dependency',
  UNKNOWN: 'unknown',
};

/**
 * Error Logging Service
 */
class ErrorLoggingService {
  constructor(config = {}) {
    // Merge default config with provided config
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize error log
    this.errorLog = [];
    
    // Initialize error batch
    this.errorBatch = [];
    
    // Initialize batch timer
    this.batchTimer = null;
    
    // Initialize error count by fingerprint
    this.errorCounts = new Map();
    
    // Initialize listeners
    this.listeners = [];
    
    // Load error log from local storage
    this._loadFromLocalStorage();
    
    // Set up global error handlers
    this._setupGlobalHandlers();
  }
  
  /**
   * Logs an error
   * 
   * @param {Error|string} error - The error to log
   * @param {Object} options - Additional options
   * @param {string} options.source - The source of the error
   * @param {string} options.severity - The severity of the error
   * @param {string} options.category - The category of the error
   * @param {Object} options.context - Additional context for the error
   * @returns {Promise<boolean>} - Whether the error was logged successfully
   */
  async logError(error, options = {}) {
    try {
      // Apply sampling
      if (Math.random() > this.config.sampleRate) {
        return true;
      }
      
      // Get error details
      const {
        source = 'client',
        severity = SeverityLevel.ERROR,
        category = ErrorCategory.UNKNOWN,
        context = {},
      } = options;
      
      // Check minimum severity
      if (!this._isSeverityLoggable(severity)) {
        return true;
      }
      
      // Format the error
      const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
      const errorStack = error.stack || '';
      const timestamp = new Date().toISOString();
      
      // Create the log entry
      const logEntry = {
        timestamp,
        source,
        severity,
        category,
        message: errorMessage,
        stack: errorStack,
        context: {
          ...context,
          ...(this.config.includeUserContext ? this._getUserContext() : {}),
          ...(this.config.includeBrowserInfo ? this._getBrowserInfo() : {}),
          ...(this.config.includeAppState ? this._getAppState() : {}),
        },
      };
      
      // Generate fingerprint for deduplication
      const fingerprint = this._generateFingerprint(logEntry);
      logEntry.fingerprint = fingerprint;
      
      // Check for duplicates
      if (this.config.deduplicate) {
        const count = this.errorCounts.get(fingerprint) || 0;
        
        if (count >= this.config.maxDuplicates) {
          // Skip logging this error
          return true;
        }
        
        this.errorCounts.set(fingerprint, count + 1);
        logEntry.occurrences = count + 1;
      }
      
      // Log to console
      if (this.config.logToConsole) {
        this._logToConsole(logEntry);
      }
      
      // Add to error log
      this.errorLog.push(logEntry);
      
      // Trim error log if it's too long
      if (this.errorLog.length > this.config.maxLocalStorageErrors) {
        this.errorLog = this.errorLog.slice(-this.config.maxLocalStorageErrors);
      }
      
      // Save to local storage
      if (this.config.logToLocalStorage) {
        this._saveToLocalStorage();
      }
      
      // Add to batch
      this.errorBatch.push(logEntry);
      
      // Send batch if it's full
      if (this.errorBatch.length >= this.config.maxBatchSize) {
        this._sendBatch();
      } else if (!this.batchTimer) {
        // Start batch timer
        this.batchTimer = setTimeout(() => {
          this._sendBatch();
        }, this.config.maxBatchWait);
      }
      
      // Notify listeners
      this._notifyListeners(logEntry);
      
      return true;
    } catch (error) {
      console.error('Error in logError:', error);
      return false;
    }
  }
  
  /**
   * Logs a debug message
   * 
   * @param {string} message - The message to log
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} - Whether the message was logged successfully
   */
  logDebug(message, options = {}) {
    return this.logError(message, {
      ...options,
      severity: SeverityLevel.DEBUG,
    });
  }
  
  /**
   * Logs an info message
   * 
   * @param {string} message - The message to log
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} - Whether the message was logged successfully
   */
  logInfo(message, options = {}) {
    return this.logError(message, {
      ...options,
      severity: SeverityLevel.INFO,
    });
  }
  
  /**
   * Logs a warning
   * 
   * @param {string|Error} warning - The warning to log
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} - Whether the warning was logged successfully
   */
  logWarning(warning, options = {}) {
    return this.logError(warning, {
      ...options,
      severity: SeverityLevel.WARNING,
    });
  }
  
  /**
   * Logs a critical error
   * 
   * @param {string|Error} error - The error to log
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} - Whether the error was logged successfully
   */
  logCritical(error, options = {}) {
    return this.logError(error, {
      ...options,
      severity: SeverityLevel.CRITICAL,
    });
  }
  
  /**
   * Gets the error log
   * 
   * @returns {Array} - The error log
   */
  getErrorLog() {
    return this.errorLog;
  }
  
  /**
   * Clears the error log
   * 
   * @returns {boolean} - Whether the error log was cleared successfully
   */
  clearErrorLog() {
    try {
      this.errorLog = [];
      this.errorCounts.clear();
      
      // Clear local storage
      if (this.config.logToLocalStorage) {
        this._clearLocalStorage();
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing error log:', error);
      return false;
    }
  }
  
  /**
   * Adds a listener for error events
   * 
   * @param {Function} listener - The listener function
   * @returns {Function} - A function to remove the listener
   */
  addListener(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
      
      // Return a function to remove the listener
      return () => {
        this.removeListener(listener);
      };
    }
    
    return () => {};
  }
  
  /**
   * Removes a listener
   * 
   * @param {Function} listener - The listener to remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Loads the error log from local storage
   * 
   * @private
   */
  _loadFromLocalStorage() {
    if (typeof window === 'undefined' || !this.config.logToLocalStorage) {
      return;
    }
    
    try {
      const storedLog = localStorage.getItem(this.config.localStorageKey);
      
      if (storedLog) {
        this.errorLog = JSON.parse(storedLog);
        
        // Rebuild error counts
        this.errorLog.forEach(entry => {
          if (entry.fingerprint) {
            const count = this.errorCounts.get(entry.fingerprint) || 0;
            this.errorCounts.set(entry.fingerprint, count + 1);
          }
        });
      }
    } catch (error) {
      console.error('Error loading error log from local storage:', error);
    }
  }
  
  /**
   * Saves the error log to local storage
   * 
   * @private
   */
  _saveToLocalStorage() {
    if (typeof window === 'undefined' || !this.config.logToLocalStorage) {
      return;
    }
    
    try {
      localStorage.setItem(this.config.localStorageKey, JSON.stringify(this.errorLog));
    } catch (error) {
      console.error('Error saving error log to local storage:', error);
    }
  }
  
  /**
   * Clears the error log from local storage
   * 
   * @private
   */
  _clearLocalStorage() {
    if (typeof window === 'undefined' || !this.config.logToLocalStorage) {
      return;
    }
    
    try {
      localStorage.removeItem(this.config.localStorageKey);
    } catch (error) {
      console.error('Error clearing error log from local storage:', error);
    }
  }
  
  /**
   * Logs an entry to the console
   * 
   * @param {Object} logEntry - The log entry to log
   * @private
   */
  _logToConsole(logEntry) {
    const { severity, message, stack } = logEntry;
    const consoleMethod = this._getSeverityConsoleMethod(severity);
    
    consoleMethod(`[${severity.toUpperCase()}] ${message}`);
    
    if (stack) {
      consoleMethod(stack);
    }
  }
  
  /**
   * Gets the console method for a severity level
   * 
   * @param {string} severity - The severity level
   * @returns {Function} - The console method
   * @private
   */
  _getSeverityConsoleMethod(severity) {
    switch (severity) {
      case SeverityLevel.DEBUG:
        return console.debug;
      case SeverityLevel.INFO:
        return console.info;
      case SeverityLevel.WARNING:
        return console.warn;
      case SeverityLevel.ERROR:
      case SeverityLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
  
  /**
   * Sends the current batch of errors to the server
   * 
   * @private
   */
  async _sendBatch() {
    // Clear the batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // If there are no errors in the batch, return
    if (this.errorBatch.length === 0) {
      return;
    }
    
    // If we're not logging to the server, return
    if (!this.config.logToServer) {
      this.errorBatch = [];
      return;
    }
    
    // Get the current batch
    const batch = [...this.errorBatch];
    this.errorBatch = [];
    
    // Send the batch to the server
    let retries = 0;
    
    const sendWithRetry = async () => {
      try {
        const response = await fetch(this.config.logEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ errors: batch }),
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
        }
      } catch (error) {
        console.error('Error sending error batch to server:', error);
        
        // Retry if we haven't reached the maximum number of retries
        if (retries < this.config.maxRetries) {
          retries++;
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          
          // Retry
          return sendWithRetry();
        }
        
        // If we've reached the maximum number of retries, add the batch back to the error batch
        this.errorBatch = [...batch, ...this.errorBatch];
      }
    };
    
    await sendWithRetry();
  }
  
  /**
   * Notifies all listeners of a new error
   * 
   * @param {Object} logEntry - The log entry
   * @private
   */
  _notifyListeners(logEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(logEntry);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }
  
  /**
   * Sets up global error handlers
   * 
   * @private
   */
  _setupGlobalHandlers() {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Handle uncaught errors
    window.addEventListener('error', event => {
      this.logError(event.error || event.message, {
        source: 'window',
        category: ErrorCategory.UNKNOWN,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.logError(event.reason || 'Unhandled promise rejection', {
        source: 'promise',
        category: ErrorCategory.UNKNOWN,
      });
    });
  }
  
  /**
   * Gets the user context
   * 
   * @returns {Object} - The user context
   * @private
   */
  _getUserContext() {
    // This should be customized based on your application
    return {
      // Example: userId: getCurrentUserId(),
    };
  }
  
  /**
   * Gets the browser information
   * 
   * @returns {Object} - The browser information
   * @private
   */
  _getBrowserInfo() {
    if (typeof window === 'undefined') {
      return {};
    }
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      url: window.location.href,
      referrer: document.referrer,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  }
  
  /**
   * Gets the application state
   * 
   * @returns {Object} - The application state
   * @private
   */
  _getAppState() {
    // This should be customized based on your application
    return {
      // Example: currentRoute: getCurrentRoute(),
    };
  }
  
  /**
   * Generates a fingerprint for an error
   * 
   * @param {Object} logEntry - The log entry
   * @returns {string} - The fingerprint
   * @private
   */
  _generateFingerprint(logEntry) {
    const { message, stack, source, category } = logEntry;
    
    // Extract the first line of the stack trace
    const stackFirstLine = stack ? stack.split('\n')[0] : '';
    
    // Combine relevant information
    const fingerprintData = `${message}|${stackFirstLine}|${source}|${category}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  }
  
  /**
   * Checks if a severity level is loggable
   * 
   * @param {string} severity - The severity level
   * @returns {boolean} - Whether the severity level is loggable
   * @private
   */
  _isSeverityLoggable(severity) {
    const severityLevels = [
      SeverityLevel.DEBUG,
      SeverityLevel.INFO,
      SeverityLevel.WARNING,
      SeverityLevel.ERROR,
      SeverityLevel.CRITICAL,
    ];
    
    const minSeverityIndex = severityLevels.indexOf(this.config.minSeverity);
    const severityIndex = severityLevels.indexOf(severity);
    
    return severityIndex >= minSeverityIndex;
  }
}

// Create a singleton instance
const errorLoggingService = new ErrorLoggingService();

// Export the service
export default errorLoggingService;

// Export types and constants
export {
  SeverityLevel,
  ErrorCategory,
  ErrorLoggingService,
};
