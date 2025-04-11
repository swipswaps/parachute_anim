/**
 * File Error Logger
 * 
 * This module provides direct file-based error logging functionality.
 * It writes errors directly to files in the repository.
 */

// Configuration
const config = {
  // Whether to log errors to the console
  logToConsole: true,
  
  // The path to the error log file
  errorLogPath: '../logs/error.log',
  
  // The path to the warning log file
  warningLogPath: '../logs/warning.log',
  
  // The path to the info log file
  infoLogPath: '../logs/info.log',
};

/**
 * Logs an error to a file
 * 
 * @param {Error|string} error - The error to log
 * @param {string} source - The source of the error
 * @param {string} level - The level of the error (error, warning, info)
 */
function logToFile(error, source = 'client', level = 'error') {
  try {
    // Format the error
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    const errorStack = error.stack || '';
    const timestamp = new Date().toISOString();
    
    // Create the log entry
    const logEntry = `[${timestamp}] [${source}] ${level.toUpperCase()}: ${errorMessage}\n${errorStack ? errorStack + '\n' : ''}\n`;
    
    // Log to console
    if (config.logToConsole) {
      console[level](`[${timestamp}] [${source}] ${level.toUpperCase()}: ${errorMessage}`);
      if (errorStack) {
        console[level](errorStack);
      }
    }
    
    // In a browser environment, we can't write directly to files
    // Instead, we'll use the console to output the log entry in a format
    // that can be easily copied and pasted into a file
    
    console.log('======== FILE ERROR LOG ENTRY ========');
    console.log(logEntry);
    console.log('======================================');
    
    // In a Node.js environment, we would write to a file
    // But since we're in a browser, we'll just log to the console
    
    // Create a downloadable log file
    if (typeof window !== 'undefined') {
      // Create a blob with the log entry
      const blob = new Blob([logEntry], { type: 'text/plain' });
      
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
  } catch (error) {
    console.error('Error in logToFile:', error);
  }
}

/**
 * Logs an error
 * 
 * @param {Error|string} error - The error to log
 * @param {string} source - The source of the error
 */
function logError(error, source = 'client') {
  logToFile(error, source, 'error');
}

/**
 * Logs a warning
 * 
 * @param {Error|string} warning - The warning to log
 * @param {string} source - The source of the warning
 */
function logWarning(warning, source = 'client') {
  logToFile(warning, source, 'warning');
}

/**
 * Logs an info message
 * 
 * @param {string} message - The message to log
 * @param {string} source - The source of the message
 */
function logInfo(message, source = 'client') {
  logToFile(message, source, 'info');
}

/**
 * Initializes the file error logger
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} - The file error logger
 */
function initFileErrorLogger(options = {}) {
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
    logError,
    logWarning,
    logInfo,
  };
}

export {
  initFileErrorLogger,
  logError,
  logWarning,
  logInfo,
};
