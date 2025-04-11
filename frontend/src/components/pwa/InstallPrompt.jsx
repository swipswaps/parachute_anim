import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '../ui/button';

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
      
      // Check if user has already dismissed or installed
      const promptDismissed = localStorage.getItem('pwa-prompt-dismissed');
      const promptTimestamp = localStorage.getItem('pwa-prompt-timestamp');
      
      // Show prompt if not dismissed in the last 30 days
      if (!promptDismissed || (promptTimestamp && Date.now() - parseInt(promptTimestamp) > 30 * 24 * 60 * 60 * 1000)) {
        setShowPrompt(true);
      }
    };
    
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Handle install button click
  const handleInstallClick = () => {
    if (!installPrompt && !isIOS) return;
    
    if (isIOS) {
      // Show iOS installation instructions
      setShowPrompt(false);
      // Show iOS-specific modal (not implemented in this example)
      // You could implement a modal with iOS installation instructions here
    } else {
      // Show the install prompt
      installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
          // Store dismissal in localStorage
          localStorage.setItem('pwa-prompt-dismissed', 'true');
          localStorage.setItem('pwa-prompt-timestamp', Date.now().toString());
        }
        
        // Clear the saved prompt since it can't be used again
        setInstallPrompt(null);
        setShowPrompt(false);
      });
    }
  };
  
  // Handle dismiss button click
  const handleDismissClick = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    localStorage.setItem('pwa-prompt-timestamp', Date.now().toString());
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3">
          <Download className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">Install App</h3>
          <p className="text-sm text-gray-600 mt-1">
            {isIOS 
              ? 'Install this app on your device: tap Share then Add to Home Screen.' 
              : 'Install this app on your device for quick and easy access when you're on the go.'}
          </p>
          <div className="mt-3 flex space-x-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={handleInstallClick}
            >
              Install
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDismissClick}
            >
              Not now
            </Button>
          </div>
        </div>
        <button 
          className="ml-2 text-gray-400 hover:text-gray-500"
          onClick={handleDismissClick}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
