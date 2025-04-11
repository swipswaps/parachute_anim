import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    // Update network status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!isOffline) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white p-2 z-50">
      <div className="container mx-auto flex items-center justify-center">
        <WifiOff className="h-5 w-5 mr-2" />
        <span>You are currently offline. Some features may be limited.</span>
      </div>
    </div>
  );
}
