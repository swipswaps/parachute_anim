import { useState, useEffect } from 'react';

/**
 * Hook for managing onboarding state
 * 
 * @param {Object} options - Hook options
 * @param {string} options.key - Local storage key for onboarding state
 * @param {boolean} options.defaultValue - Default value for onboarding state
 * @param {number} options.version - Onboarding version (increment to show again after updates)
 * @returns {Object} - Onboarding state and functions
 */
export default function useOnboarding({
  key = 'onboarding-completed',
  defaultValue = false,
  version = 1,
} = {}) {
  // State for whether onboarding is completed
  const [completed, setCompleted] = useState(() => {
    try {
      // Get from local storage
      const item = localStorage.getItem(key);
      
      // Parse stored json or if none return defaultValue
      if (item) {
        const parsed = JSON.parse(item);
        // If version is newer, return defaultValue
        if (parsed.version < version) {
          return defaultValue;
        }
        return parsed.completed;
      }
      
      return defaultValue;
    } catch (error) {
      console.error('Error reading onboarding state from localStorage:', error);
      return defaultValue;
    }
  });
  
  // State for whether onboarding is open
  const [isOpen, setIsOpen] = useState(!completed);
  
  // Update local storage when completed changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ completed, version }));
    } catch (error) {
      console.error('Error saving onboarding state to localStorage:', error);
    }
  }, [completed, key, version]);
  
  // Complete onboarding
  const complete = () => {
    setCompleted(true);
    setIsOpen(false);
  };
  
  // Skip onboarding
  const skip = () => {
    setCompleted(true);
    setIsOpen(false);
  };
  
  // Reset onboarding
  const reset = () => {
    setCompleted(false);
    setIsOpen(true);
  };
  
  // Open onboarding
  const open = () => {
    setIsOpen(true);
  };
  
  // Close onboarding
  const close = () => {
    setIsOpen(false);
  };
  
  return {
    completed,
    isOpen,
    complete,
    skip,
    reset,
    open,
    close,
  };
}
