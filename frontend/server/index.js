/**
 * Development Server
 *
 * This server provides development-time services like error logging.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const createErrorLoggerRouter = require('./routes/errorLoggerRoutes');
const { logError, logInfo, ErrorCategory } = require('./services/errorLoggingService');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'http-access.log'), { flags: 'a' });

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors());

// Request logging
app.use(morgan('combined', { stream: accessLogStream }));

// Parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Add error logger router
app.use(createErrorLoggerRouter());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logError(err, {
    source: 'server',
    category: ErrorCategory.API,
    context: {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Start the server
app.listen(PORT, () => {
  logInfo(`Development server running on port ${PORT}`, {
    source: 'server',
    category: ErrorCategory.SYSTEM,
  });
  console.log(`Development server running on port ${PORT}`);
});
