/**
 * Server-Side Error Logging Service
 * 
 * A production-ready error logging service for the server.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { createHash } = require('crypto');
const winston = require('winston');
const { format } = winston;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log file paths
const errorLogFile = path.join(logsDir, 'error.log');
const combinedLogFile = path.join(logsDir, 'combined.log');
const accessLogFile = path.join(logsDir, 'access.log');

// Define severity levels
const SeverityLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// Define error categories
const ErrorCategory = {
  NETWORK: 'network',
  API: 'api',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  DATABASE: 'database',
  SYSTEM: 'system',
  UNKNOWN: 'unknown',
};

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'error-logging-service' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: errorLogFile, 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: combinedLogFile,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
  }));
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
 */
function logError(error, options = {}) {
  try {
    // Get error details
    const {
      source = 'server',
      severity = SeverityLevel.ERROR,
      category = ErrorCategory.UNKNOWN,
      context = {},
    } = options;
    
    // Format the error
    const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
    const errorStack = error.stack || '';
    
    // Create the log entry
    const logEntry = {
      source,
      severity,
      category,
      message: errorMessage,
      stack: errorStack,
      context: {
        ...context,
        ...getSystemInfo(),
      },
    };
    
    // Generate fingerprint for deduplication
    const fingerprint = generateFingerprint(logEntry);
    logEntry.fingerprint = fingerprint;
    
    // Log using Winston
    logger.log(mapSeverityToWinstonLevel(severity), errorMessage, {
      ...logEntry,
      error: error instanceof Error ? error : new Error(errorMessage),
    });
    
    return true;
  } catch (err) {
    console.error('Error in logError:', err);
    return false;
  }
}

/**
 * Logs a debug message
 * 
 * @param {string} message - The message to log
 * @param {Object} options - Additional options
 */
function logDebug(message, options = {}) {
  return logError(message, {
    ...options,
    severity: SeverityLevel.DEBUG,
  });
}

/**
 * Logs an info message
 * 
 * @param {string} message - The message to log
 * @param {Object} options - Additional options
 */
function logInfo(message, options = {}) {
  return logError(message, {
    ...options,
    severity: SeverityLevel.INFO,
  });
}

/**
 * Logs a warning
 * 
 * @param {string|Error} warning - The warning to log
 * @param {Object} options - Additional options
 */
function logWarning(warning, options = {}) {
  return logError(warning, {
    ...options,
    severity: SeverityLevel.WARNING,
  });
}

/**
 * Logs a critical error
 * 
 * @param {string|Error} error - The error to log
 * @param {Object} options - Additional options
 */
function logCritical(error, options = {}) {
  return logError(error, {
    ...options,
    severity: SeverityLevel.CRITICAL,
  });
}

/**
 * Logs an access to the access log file
 * 
 * @param {Object} req - The request object
 * @param {string} action - The action performed
 */
function logAccess(req, action) {
  try {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Create the log entry
    const logEntry = {
      timestamp,
      ip,
      method,
      url,
      userAgent,
      action,
    };
    
    // Log to file
    fs.appendFileSync(accessLogFile, JSON.stringify(logEntry) + '\n');
    
    return true;
  } catch (err) {
    console.error('Error in logAccess:', err);
    return false;
  }
}

/**
 * Gets system information
 * 
 * @returns {Object} - System information
 */
function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    uptime: os.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
  };
}

/**
 * Generates a fingerprint for an error
 * 
 * @param {Object} logEntry - The log entry
 * @returns {string} - The fingerprint
 */
function generateFingerprint(logEntry) {
  const { message, stack, source, category } = logEntry;
  
  // Extract the first line of the stack trace
  const stackFirstLine = stack ? stack.split('\n')[0] : '';
  
  // Combine relevant information
  const fingerprintData = `${message}|${stackFirstLine}|${source}|${category}`;
  
  // Create SHA-256 hash
  return createHash('sha256').update(fingerprintData).digest('hex');
}

/**
 * Maps a severity level to a Winston log level
 * 
 * @param {string} severity - The severity level
 * @returns {string} - The Winston log level
 */
function mapSeverityToWinstonLevel(severity) {
  switch (severity) {
    case SeverityLevel.DEBUG:
      return 'debug';
    case SeverityLevel.INFO:
      return 'info';
    case SeverityLevel.WARNING:
      return 'warn';
    case SeverityLevel.ERROR:
      return 'error';
    case SeverityLevel.CRITICAL:
      return 'error';
    default:
      return 'info';
  }
}

/**
 * Gets all errors from the error log file
 * 
 * @returns {Array} - The errors
 */
function getErrors() {
  try {
    if (!fs.existsSync(errorLogFile)) {
      return [];
    }
    
    const content = fs.readFileSync(errorLogFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (err) {
        return { message: line };
      }
    });
  } catch (err) {
    console.error('Error getting errors:', err);
    return [];
  }
}

/**
 * Clears the error log file
 * 
 * @returns {boolean} - Whether the error log was cleared successfully
 */
function clearErrors() {
  try {
    if (fs.existsSync(errorLogFile)) {
      fs.writeFileSync(errorLogFile, '');
    }
    
    return true;
  } catch (err) {
    console.error('Error clearing errors:', err);
    return false;
  }
}

module.exports = {
  logError,
  logDebug,
  logInfo,
  logWarning,
  logCritical,
  logAccess,
  getErrors,
  clearErrors,
  SeverityLevel,
  ErrorCategory,
};
