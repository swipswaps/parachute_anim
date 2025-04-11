/**
 * File Logger
 * 
 * This module provides direct file-based logging functionality.
 */

// Configuration
const config = {
  // Whether to log to the console
  logToConsole: true,
  
  // Whether to attempt to download log files
  downloadLogs: true,
};

/**
 * Logs a message to a file
 * 
 * @param {string} message - The message to log
 * @param {string} level - The level of the message (error, warning, info)
 * @param {string} source - The source of the message
 */
function log(message, level = 'info', source = 'app') {
  try {
    // Format the message
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${source}] ${level.toUpperCase()}: ${message}\n`;
    
    // Log to console
    if (config.logToConsole) {
      console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
        `[${timestamp}] [${source}] ${level.toUpperCase()}: ${message}`
      );
    }
    
    // In a browser environment, we can't write directly to files
    // Instead, we'll download the log file if configured to do so
    if (config.downloadLogs && typeof window !== 'undefined') {
      // Create a blob with the log entry
      const blob = new Blob([formattedMessage], { type: 'text/plain' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `${level}-log-${timestamp}.txt`;
      
      // Append the link to the document
      document.body.appendChild(a);
      
      // Click the link
      a.click();
      
      // Remove the link
      document.body.removeChild(a);
      
      // Revoke the URL
      URL.revokeObjectURL(url);
    }
    
    return true;
  } catch (error) {
    console.error('Error in log:', error);
    return false;
  }
}

/**
 * Logs an error
 * 
 * @param {Error|string} error - The error to log
 * @param {string} source - The source of the error
 * @returns {boolean} - Whether the error was logged successfully
 */
function logError(error, source = 'app') {
  const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
  const errorStack = error.stack || '';
  
  return log(`${errorMessage}\n${errorStack}`, 'error', source);
}

/**
 * Logs a warning
 * 
 * @param {string} message - The warning message to log
 * @param {string} source - The source of the warning
 * @returns {boolean} - Whether the warning was logged successfully
 */
function logWarning(message, source = 'app') {
  return log(message, 'warning', source);
}

/**
 * Logs an info message
 * 
 * @param {string} message - The message to log
 * @param {string} source - The source of the message
 * @returns {boolean} - Whether the message was logged successfully
 */
function logInfo(message, source = 'app') {
  return log(message, 'info', source);
}

/**
 * Initializes the file logger
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} - The file logger
 */
function initFileLogger(options = {}) {
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
  }
  
  return {
    log,
    logError,
    logWarning,
    logInfo,
  };
}

export {
  initFileLogger,
  log,
  logError,
  logWarning,
  logInfo,
};
