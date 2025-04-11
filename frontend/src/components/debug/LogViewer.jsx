/**
 * Log Viewer Component
 * 
 * This component displays the error log.
 */

import React, { useState, useEffect } from 'react';
import { getErrorLog, clearErrorLog } from '../../utils/errorLogger';

const LogViewer = () => {
  const [errorLog, setErrorLog] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load error log
  useEffect(() => {
    setErrorLog(getErrorLog());
    
    // Set up interval to refresh error log
    const interval = setInterval(() => {
      setErrorLog(getErrorLog());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Filter error log
  const filteredLog = errorLog.filter(entry => {
    // Filter by level
    if (filter !== 'all' && entry.level !== filter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !entry.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Handle clear log
  const handleClearLog = () => {
    if (window.confirm('Are you sure you want to clear the error log?')) {
      clearErrorLog();
      setErrorLog([]);
    }
  };
  
  // Handle copy log
  const handleCopyLog = () => {
    const logText = filteredLog.map(entry => {
      return `[${entry.timestamp}] [${entry.source}] ${entry.level.toUpperCase()}: ${entry.message}${entry.stack ? '\n' + entry.stack : ''}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      alert('Log copied to clipboard');
    }).catch(error => {
      console.error('Error copying log to clipboard:', error);
      alert('Error copying log to clipboard');
    });
  };
  
  // Handle export log
  const handleExportLog = () => {
    const logText = JSON.stringify(filteredLog, null, 2);
    const blob = new Blob([logText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Error Log</h2>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center">
          <label htmlFor="filter" className="mr-2 text-sm font-medium">Filter:</label>
          <select
            id="filter"
            className="border rounded px-2 py-1 text-sm"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <label htmlFor="search" className="mr-2 text-sm font-medium">Search:</label>
          <input
            id="search"
            type="text"
            className="border rounded px-2 py-1 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search log..."
          />
        </div>
        
        <div className="flex gap-2 ml-auto">
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            onClick={handleCopyLog}
          >
            Copy
          </button>
          <button
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            onClick={handleExportLog}
          >
            Export
          </button>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            onClick={handleClearLog}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="border rounded overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex">
          <div className="w-40 font-medium text-sm">Timestamp</div>
          <div className="w-24 font-medium text-sm">Level</div>
          <div className="w-24 font-medium text-sm">Source</div>
          <div className="flex-1 font-medium text-sm">Message</div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredLog.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No log entries found.
            </div>
          ) : (
            filteredLog.map((entry, index) => (
              <div
                key={index}
                className={`px-4 py-2 border-b ${
                  entry.level === 'error' ? 'bg-red-50' :
                  entry.level === 'warning' ? 'bg-yellow-50' :
                  'bg-blue-50'
                }`}
              >
                <div className="flex mb-1">
                  <div className="w-40 text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString()}</div>
                  <div className="w-24 text-xs">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${
                        entry.level === 'error' ? 'bg-red-100 text-red-800' :
                        entry.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {entry.level}
                    </span>
                  </div>
                  <div className="w-24 text-xs text-gray-600">{entry.source}</div>
                  <div className="flex-1 text-sm font-medium">{entry.message}</div>
                </div>
                
                {entry.stack && (
                  <div className="ml-64 mt-1 text-xs font-mono whitespace-pre-wrap text-gray-600 bg-gray-50 p-2 rounded">
                    {entry.stack}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Showing {filteredLog.length} of {errorLog.length} log entries
      </div>
    </div>
  );
};

export default LogViewer;
