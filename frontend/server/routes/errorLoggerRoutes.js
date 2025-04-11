/**
 * Error Logger Routes
 * 
 * This module provides routes for error logging.
 */

const express = require('express');
const { 
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
} = require('../services/errorLoggingService');

/**
 * Creates an Express router for error logging
 * 
 * @returns {Object} - Express router
 */
function createErrorLoggerRouter() {
  const router = express.Router();
  
  // Endpoint for logging client-side errors
  router.post('/api/log/error', (req, res) => {
    try {
      const { error, stack, source, level = 'error', category = 'unknown', context = {}, timestamp } = req.body;
      
      if (!error) {
        return res.status(400).json({ success: false, message: 'Error message is required' });
      }
      
      // Map level to severity
      let severity;
      switch (level) {
        case 'debug':
          severity = SeverityLevel.DEBUG;
          break;
        case 'info':
          severity = SeverityLevel.INFO;
          break;
        case 'warning':
        case 'warn':
          severity = SeverityLevel.WARNING;
          break;
        case 'error':
          severity = SeverityLevel.ERROR;
          break;
        case 'critical':
          severity = SeverityLevel.CRITICAL;
          break;
        default:
          severity = SeverityLevel.ERROR;
      }
      
      // Create error object
      const errorObj = stack ? new Error(error) : error;
      if (stack) {
        errorObj.stack = stack;
      }
      
      // Log the error
      logError(errorObj, {
        source: source || 'client',
        severity,
        category,
        context: {
          ...context,
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.connection.remoteAddress,
          timestamp,
        },
      });
      
      // Log the access
      logAccess(req, 'Error logged');
      
      return res.status(200).json({ success: true });
    } catch (err) {
      logError(err, { source: 'server', category: ErrorCategory.API });
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  // Endpoint for logging client-side errors in batch
  router.post('/api/log/errors', (req, res) => {
    try {
      const { errors } = req.body;
      
      if (!errors || !Array.isArray(errors)) {
        return res.status(400).json({ success: false, message: 'Errors array is required' });
      }
      
      // Log each error
      errors.forEach(errorData => {
        const { error, stack, source, level = 'error', category = 'unknown', context = {}, timestamp } = errorData;
        
        if (!error) {
          return;
        }
        
        // Map level to severity
        let severity;
        switch (level) {
          case 'debug':
            severity = SeverityLevel.DEBUG;
            break;
          case 'info':
            severity = SeverityLevel.INFO;
            break;
          case 'warning':
          case 'warn':
            severity = SeverityLevel.WARNING;
            break;
          case 'error':
            severity = SeverityLevel.ERROR;
            break;
          case 'critical':
            severity = SeverityLevel.CRITICAL;
            break;
          default:
            severity = SeverityLevel.ERROR;
        }
        
        // Create error object
        const errorObj = stack ? new Error(error) : error;
        if (stack) {
          errorObj.stack = stack;
        }
        
        // Log the error
        logError(errorObj, {
          source: source || 'client',
          severity,
          category,
          context: {
            ...context,
            userAgent: req.headers['user-agent'],
            ip: req.ip || req.connection.remoteAddress,
            timestamp,
          },
        });
      });
      
      // Log the access
      logAccess(req, 'Batch errors logged');
      
      return res.status(200).json({ success: true });
    } catch (err) {
      logError(err, { source: 'server', category: ErrorCategory.API });
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  // Endpoint for retrieving error logs
  router.get('/api/log/errors', (req, res) => {
    try {
      // Get errors
      const errors = getErrors();
      
      // Log the access
      logAccess(req, 'Error log retrieved');
      
      return res.status(200).json({ success: true, errors });
    } catch (err) {
      logError(err, { source: 'server', category: ErrorCategory.API });
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  // Endpoint for clearing error logs
  router.delete('/api/log/errors', (req, res) => {
    try {
      // Clear errors
      clearErrors();
      
      // Log the access
      logAccess(req, 'Error log cleared');
      
      return res.status(200).json({ success: true });
    } catch (err) {
      logError(err, { source: 'server', category: ErrorCategory.API });
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  
  return router;
}

module.exports = createErrorLoggerRouter;
