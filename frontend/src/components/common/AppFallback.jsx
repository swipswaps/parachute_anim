/**
 * App Fallback Component
 * 
 * This component is displayed when the main App component fails to load.
 */

import React, { useState, useEffect } from 'react';
import { attemptRecovery } from '../../utils/pageLoadVerifier';

const AppFallback = () => {
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  
  useEffect(() => {
    // Capture any error details from the console
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      setErrorDetails(prev => prev + args.join(' ') + '\\n');
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  const handleRetry = async () => {
    setIsRecovering(true);
    setRecoveryAttempts(prev => prev + 1);
    
    try {
      await attemptRecovery();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error during recovery:', error);
      setIsRecovering(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Application Error</h2>
        <p className="text-gray-600 text-center mb-6">
          The application encountered an error while loading. This may be due to missing dependencies or network issues.
        </p>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-900">Troubleshooting steps:</h3>
            <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Check your internet connection</li>
              <li>Clear your browser cache</li>
              <li>Try using a different browser</li>
              <li>Disable browser extensions</li>
            </ul>
          </div>
          
          {errorDetails && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Error details:</h3>
              <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-32">
                {errorDetails.split('\\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <button
              onClick={handleRetry}
              disabled={isRecovering}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                isRecovering ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRecovering ? 'Recovering...' : `Retry${recoveryAttempts > 0 ? ` (${recoveryAttempts})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppFallback;
