# Frontend Application

This is the frontend application for the Parachute Animation project, a system that processes video segments into 3D models using photogrammetry techniques, specifically for visualizing airflow around an opening parachute.

## Repository Cleanup

This repository has undergone a cleanup process to eliminate false assertions and properly document the actual state of the codebase. The following actions were taken:

1. **Updated Compliance Table**: The REQUEST_COMPLIANCE_TABLE.md file has been updated to accurately reflect the actual state of the codebase, distinguishing between implemented changes and proposed solutions.

2. **Documentation of Proposed Enhancements**: A PROPOSED_ENHANCEMENTS.md file has been created to properly document enhancements that have been proposed but not yet implemented.

3. **Linting Guide**: A LINTING_GUIDE.md file has been created to explain how to identify and "lint" (remove or properly document) proposed but unimplemented changes from the repository.

4. **Assertion Linting Script**: A lint-assertions.sh script has been created to help identify potential false assertions in the codebase.

5. **Code Comments**: Configuration files have been updated to include comments about proposed enhancements that haven't been implemented yet.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- OpenFOAM (v10 or compatible version)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Install server dependencies:

```bash
cd server && npm install && cd ..
```

4. Configure OpenFOAM:

```bash
# Fix OpenFOAM configuration in your .bashrc file
./bashrc-fix.sh
```

### Development

To start the development server:

```bash
npm run dev
```

To start the development server with OpenFOAM configuration:

```bash
./start-dev-with-openfoam.sh
```

To start both the frontend and the development server:

```bash
./start-dev.sh
```

### Production

To build for production:

```bash
npm run build
```

## Error Logging System

The application includes a comprehensive error logging system that captures and logs errors in multiple ways:

### Client-Side Error Logging

Errors are logged to:

1. **Console**: All errors are logged to the console
2. **Local Storage**: Errors are stored in local storage for persistence
3. **Server**: Errors are sent to the server for centralized logging

### Server-Side Error Logging

The development server includes an error logging API that:

1. Saves errors to log files
2. Provides endpoints for retrieving and managing logs

### Debug Page

The application includes a debug page at `/debug` that provides:

1. **Error Log Viewer**: View, filter, and search error logs
2. **Export Functionality**: Export logs as JSON
3. **Test Tools**: Generate test errors, warnings, and info messages

### Usage

To log errors in your code:

```javascript
import { logError, logWarning, logInfo } from '../utils/errorLogger';

// Log an error
try {
  // Some code that might throw an error
} catch (error) {
  logError(error, 'component-name');
}

// Log a warning
logWarning('Something might be wrong', 'component-name');

// Log an info message
logInfo('Something happened', 'component-name');
```

To view logs, navigate to `/debug` in the application.

## Documentation

- [Troubleshooting Guide](./TROUBLESHOOTING.md): Solutions for common issues
- [Proposed Enhancements](./PROPOSED_ENHANCEMENTS.md): Features that have been proposed but not yet implemented
- [Linting Guide](./LINTING_GUIDE.md): How to identify and fix false assertions in the codebase
- [Request Compliance Table](./REQUEST_COMPLIANCE_TABLE.md): Documentation of how user requests have been addressed

## Folder Structure

- `src/`: Source code
  - `components/`: React components
  - `utils/`: Utility functions
  - `pages/`: Page components
  - `contexts/`: React contexts
- `server/`: Development server
  - `errorLogger.js`: Error logging functionality
  - `index.js`: Server entry point
- `logs/`: Log files (created at runtime)
  - `error.log`: Error log file
  - `access.log`: Access log file
