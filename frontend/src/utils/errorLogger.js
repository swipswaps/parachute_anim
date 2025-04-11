/**
 * Error Logger
 * 
 * This module provides client-side error logging functionality.
 */

// Configuration
const config = {
  // Whether to log errors to the console
  logToConsole: true,
  
  // Whether to log errors to the server
  logToServer: true,
  
  // The URL of the error logging endpoint
  logEndpoint: 'http://localhost:3001/api/log/error',
  
  // Whether to log errors to local storage
  logToLocalStorage: true,
  
  // The maximum number of errors to store in local storage
  maxLocalStorageErrors: 100,
  
  // The local storage key for errors
  localStorageKey: 'app_error_log',
};

// Error log
let errorLog = [];

// Load error log from local storage
if (typeof window !== 'undefined' && config.logToLocalStorage) {
  try {
    const storedLog = localStorage.getItem(config.localStorageKey);
    if (storedLog) {
      errorLog = JSON.parse(storedLog);
    }
  } catch (error) {
    console.error('Error loading error log from local storage:', error);
  }
}

/**
 * Logs an error
 * 
 * @param {Error|string} error - The error to log
 * @param {string} source - The source of the error
 * @param {string} level - The level of the error (error, warning, info)
 * @returns {Promise<boolean>} - Whether the error was logged successfully
 */
async function logError(error, source = 'client', level = 'error') {
  try {
    // Format the error
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    const errorStack = error.stack || '';
    const timestamp = new Date().toISOString();
    
    // Create the log entry
    const logEntry = {
      timestamp,
      source,
      level,
      message: errorMessage,
      stack: errorStack,
    };
    
    // Log to console
    if (config.logToConsole) {
      console[level](`[${timestamp}] [${source}] ${level.toUpperCase()}: ${errorMessage}`);
      if (errorStack) {
        console[level](errorStack);
      }
    }
    
    // Add to error log
    errorLog.push(logEntry);
    
    // Trim error log if it's too long
    if (errorLog.length > config.maxLocalStorageErrors) {
      errorLog = errorLog.slice(-config.maxLocalStorageErrors);
    }
    
    // Save to local storage
    if (typeof window !== 'undefined' && config.logToLocalStorage) {
      try {
        localStorage.setItem(config.localStorageKey, JSON.stringify(errorLog));
      } catch (error) {
        console.error('Error saving error log to local storage:', error);
      }
    }
    
    // Log to server
    if (config.logToServer) {
      try {
        const response = await fetch(config.logEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: errorMessage,
            stack: errorStack,
            source,
            level,
            timestamp,
          }),
        });
        
        if (!response.ok) {
          console.error('Error logging to server:', await response.text());
        }
      } catch (error) {
        console.error('Error sending error log to server:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in logError:', error);
    return false;
  }
}

/**
 * Logs a warning
 * 
 * @param {Error|string} warning - The warning to log
 * @param {string} source - The source of the warning
 * @returns {Promise<boolean>} - Whether the warning was logged successfully
 */
function logWarning(warning, source = 'client') {
  return logError(warning, source, 'warning');
}

/**
 * Logs an info message
 * 
 * @param {string} message - The message to log
 * @param {string} source - The source of the message
 * @returns {Promise<boolean>} - Whether the message was logged successfully
 */
function logInfo(message, source = 'client') {
  return logError(message, source, 'info');
}

/**
 * Gets the error log
 * 
 * @returns {Array} - The error log
 */
function getErrorLog() {
  return errorLog;
}

/**
 * Clears the error log
 * 
 * @returns {boolean} - Whether the error log was cleared successfully
 */
function clearErrorLog() {
  try {
    errorLog = [];
    
    // Clear local storage
    if (typeof window !== 'undefined' && config.logToLocalStorage) {
      localStorage.removeItem(config.localStorageKey);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing error log:', error);
    return false;
  }
}

/**
 * Initializes the error logger
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} - The error logger
 */
function initErrorLogger(options = {}) {
  // Update configuration
  Object.assign(config, options);
  
  // Set up global error handlers
  if (typeof window !== 'undefined') {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      logError(event.error || event.message, 'window');
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logError(event.reason || 'Unhandled promise rejection', 'promise');
    });
    
    // Override console methods
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    console.error = function() {
      originalConsoleError.apply(console, arguments);
      logError(Array.from(arguments).join(' '), 'console');
    };
    
    console.warn = function() {
      originalConsoleWarn.apply(console, arguments);
      logWarning(Array.from(arguments).join(' '), 'console');
    };
    
    console.log = function() {
      originalConsoleLog.apply(console, arguments);
      // We don't log info messages from console.log to avoid excessive logging
    };
  }
  
  return {
    logError,
    logWarning,
    logInfo,
    getErrorLog,
    clearErrorLog,
  };
}

export {
  initErrorLogger,
  logError,
  logWarning,
  logInfo,
  getErrorLog,
  clearErrorLog,
};
