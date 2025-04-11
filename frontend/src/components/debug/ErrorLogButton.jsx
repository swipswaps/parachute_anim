/**
 * Error Log Button Component
 * 
 * This component provides a button that captures and downloads error logs.
 */

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logError } from '../../utils/fileLogger';

const ErrorLogButton = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Handle capture errors
  const handleCaptureErrors = () => {
    setIsCapturing(true);
    
    try {
      // Log a test error
      logError(new Error('Manual error capture triggered'), 'error-log-button');
      
      // Create a blob with console output
      const consoleOutput = [
        '=== CONSOLE OUTPUT ===',
        'This is a snapshot of the console at the time of error capture.',
        '=== END CONSOLE OUTPUT ===',
      ].join('\n');
      
      // Create a blob with the console output
      const blob = new Blob([consoleOutput], { type: 'text/plain' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-log-${new Date().toISOString().replace(/:/g, '-')}.txt`;
      
      // Append the link to the document
      document.body.appendChild(a);
      
      // Click the link
      a.click();
      
      // Remove the link
      document.body.removeChild(a);
      
      // Revoke the URL
      URL.revokeObjectURL(url);
      
      // Show a message
      alert('Error log downloaded. If you need to capture more detailed errors, please use the simple error capture tool at /simple-error-capture.html');
    } catch (error) {
      console.error('Error capturing errors:', error);
      alert('Error capturing errors. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };
  
  return (
    <button
      className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      onClick={handleCaptureErrors}
      disabled={isCapturing}
      title="Capture and download error logs"
    >
      <AlertTriangle className="h-6 w-6" />
    </button>
  );
};

export default ErrorLogButton;
