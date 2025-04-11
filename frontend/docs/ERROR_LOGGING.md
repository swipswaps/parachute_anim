# Error Logging System

This document describes the error logging system used in the application.

## Overview

The application uses a comprehensive error logging system that follows industry best practices. It captures errors from various sources and logs them in multiple ways to ensure that errors are properly tracked and can be diagnosed.

## Components

The error logging system consists of the following components:

### 1. Client-Side Error Logging

The client-side error logging is handled by the `errorLoggingService` in `src/services/errorLoggingService.js`. This service:

- Captures uncaught errors and unhandled promise rejections
- Logs errors to the console
- Stores errors in local storage for persistence
- Sends errors to the server for centralized logging
- Provides a clean API for logging errors, warnings, and info messages
- Supports batching, retries, and deduplication
- Includes contextual information like browser details and user context

### 2. Server-Side Error Logging

The server-side error logging is handled by the `errorLoggingService` in `server/services/errorLoggingService.js`. This service:

- Uses Winston for structured logging
- Logs errors to files with rotation
- Provides a clean API for logging errors, warnings, and info messages
- Includes contextual information like system details
- Supports deduplication

### 3. Error Boundaries

The application uses React error boundaries to catch and handle errors in the component tree. The main error boundary component is in `src/components/ErrorBoundary.jsx`. This component:

- Catches errors in the component tree
- Logs errors to the error logging service
- Provides a user-friendly fallback UI
- Allows users to try to recover without refreshing the page
- Allows users to download error details for reporting

### 4. Error Capture Tools

The application includes several tools for capturing and diagnosing errors:

- **Robust Error Capture Tool**: A standalone HTML page at `/robust-error-capture.html` that allows users to save error messages to a file.
- **Error Log Button**: A button in the application that captures and downloads error logs.
- **Debug Page**: A page at `/debug` that provides tools for viewing and analyzing errors.

## Usage

### Logging Errors in Code

To log errors in your code, use the `errorLoggingService`:

```javascript
import errorLoggingService, { SeverityLevel, ErrorCategory } from '../services/errorLoggingService';

// Log an error
try {
  // Some code that might throw an error
} catch (error) {
  errorLoggingService.logError(error, {
    source: 'component-name',
    severity: SeverityLevel.ERROR,
    category: ErrorCategory.API,
    context: {
      // Additional context
    },
  });
}

// Log a warning
errorLoggingService.logWarning('Something might be wrong', {
  source: 'component-name',
});

// Log an info message
errorLoggingService.logInfo('Something happened', {
  source: 'component-name',
});
```

### Using Error Boundaries

To use an error boundary, wrap your components with it:

```jsx
import ErrorBoundary from '../components/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary componentName="MyComponent">
      {/* Your component content */}
    </ErrorBoundary>
  );
}
```

### Capturing Errors

If you encounter an error in the application, you can:

1. Click the error log button in the bottom-right corner of the screen to download error logs.
2. Navigate to `/robust-error-capture.html` to manually capture and save error messages.
3. Navigate to `/debug` to view and analyze errors.

## Best Practices

1. **Always log errors**: Make sure to log all errors, even if they're handled.
2. **Include context**: Always include relevant context when logging errors.
3. **Use appropriate severity levels**: Use the appropriate severity level for each log message.
4. **Use error boundaries**: Wrap components with error boundaries to prevent the entire application from crashing.
5. **Monitor logs**: Regularly monitor error logs to identify and fix issues.

## Troubleshooting

If you're having issues with the error logging system:

1. Check the browser console for any errors related to the error logging system.
2. Check the server logs for any errors related to the error logging system.
3. Make sure the server is running and accessible.
4. Try using the robust error capture tool to manually capture and save error messages.

## Contributing

If you want to contribute to the error logging system:

1. Follow the existing patterns and conventions.
2. Make sure to test your changes thoroughly.
3. Update this documentation if necessary.

## License

This error logging system is part of the application and is subject to the same license as the application.
