/**
 * Error Logger
 * 
 * This module provides server-side error logging functionality.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create error log file
const errorLogFile = path.join(logsDir, 'error.log');
const accessLogFile = path.join(logsDir, 'access.log');

/**
 * Logs an error to the error log file
 * 
 * @param {Object} error - The error object
 * @param {string} source - The source of the error
 */
function logError(error, source = 'server') {
  const timestamp = new Date().toISOString();
  const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
  const errorStack = error.stack || '';
  
  const logEntry = `[${timestamp}] [${source}] ERROR: ${errorMessage}\n${errorStack}\n\n`;
  
  fs.appendFileSync(errorLogFile, logEntry);
  console.error(`Logged error from ${source}: ${errorMessage}`);
}

/**
 * Logs an access to the access log file
 * 
 * @param {Object} req - The request object
 * @param {string} action - The action performed
 */
function logAccess(req, action) {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  const logEntry = `[${timestamp}] [${ip}] ${method} ${url} "${userAgent}" - ${action}\n`;
  
  fs.appendFileSync(accessLogFile, logEntry);
}

/**
 * Creates an Express router for error logging
 * 
 * @returns {Object} - Express router
 */
function createErrorLoggerRouter() {
  const router = express.Router();
  
  // Parse JSON request bodies
  router.use(bodyParser.json());
  
  // Endpoint for logging client-side errors
  router.post('/api/log/error', (req, res) => {
    try {
      const { error, source, level = 'error', timestamp } = req.body;
      
      if (!error) {
        return res.status(400).json({ success: false, message: 'Error message is required' });
      }
      
      // Format the log entry
      const formattedTimestamp = timestamp || new Date().toISOString();
      const logEntry = `[${formattedTimestamp}] [${source || 'client'}] ${level.toUpperCase()}: ${error}\n`;
      
      // Append to the error log file
      fs.appendFileSync(errorLogFile, logEntry);
      
      // Log the access
      logAccess(req, 'Error logged');
      
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error logging client error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  // Endpoint for retrieving error logs
  router.get('/api/log/errors', (req, res) => {
    try {
      // Check if the error log file exists
      if (!fs.existsSync(errorLogFile)) {
        return res.status(404).json({ success: false, message: 'Error log file not found' });
      }
      
      // Read the error log file
      const errorLog = fs.readFileSync(errorLogFile, 'utf8');
      
      // Log the access
      logAccess(req, 'Error log retrieved');
      
      return res.status(200).json({ success: true, log: errorLog });
    } catch (err) {
      console.error('Error retrieving error logs:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  // Endpoint for clearing error logs
  router.delete('/api/log/errors', (req, res) => {
    try {
      // Check if the error log file exists
      if (!fs.existsSync(errorLogFile)) {
        return res.status(404).json({ success: false, message: 'Error log file not found' });
      }
      
      // Clear the error log file
      fs.writeFileSync(errorLogFile, '');
      
      // Log the access
      logAccess(req, 'Error log cleared');
      
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error clearing error logs:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  return router;
}

module.exports = {
  logError,
  logAccess,
  createErrorLoggerRouter,
};
