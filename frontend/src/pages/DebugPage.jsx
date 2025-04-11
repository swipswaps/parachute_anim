/**
 * Debug Page
 * 
 * This page provides debugging tools.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LogViewer from '../components/debug/LogViewer';
import { logError, logWarning, logInfo } from '../utils/errorLogger';

const DebugPage = () => {
  const [activeTab, setActiveTab] = useState('logs');
  
  // Handle test error
  const handleTestError = () => {
    try {
      throw new Error('Test error');
    } catch (error) {
      logError(error, 'debug-page');
    }
  };
  
  // Handle test warning
  const handleTestWarning = () => {
    logWarning('Test warning', 'debug-page');
  };
  
  // Handle test info
  const handleTestInfo = () => {
    logInfo('Test info', 'debug-page');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Debug Tools</h1>
        <Link to="/" className="text-blue-500 hover:underline">Back to Home</Link>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('logs')}
            >
              Error Logs
            </button>
            <button
              className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('test')}
            >
              Test Tools
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'logs' && (
        <LogViewer />
      )}
      
      {activeTab === 'test' && (
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Test Tools</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Test Logging</h3>
              <div className="flex gap-2">
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={handleTestError}
                >
                  Log Error
                </button>
                <button
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  onClick={handleTestWarning}
                >
                  Log Warning
                </button>
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={handleTestInfo}
                >
                  Log Info
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Component Testing</h3>
              <div className="flex gap-2">
                <Link
                  to="/accessibility"
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Test Accessibility Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPage;
