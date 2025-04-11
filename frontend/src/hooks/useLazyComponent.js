import { lazy, useState, useEffect } from 'react';

/**
 * Custom hook for lazy loading components
 * @param {Function} importFunction - The import function for the component
 * @param {Object} options - Options for the hook
 * @param {boolean} options.preload - Whether to preload the component
 * @param {number} options.delay - Delay before preloading in milliseconds
 * @returns {Object} - The lazy component and loading state
 */
export default function useLazyComponent(importFunction, options = {}) {
  const { preload = false, delay = 0 } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Create the lazy component
  const LazyComponent = lazy(() => {
    const promise = importFunction().then((module) => {
      setIsLoaded(true);
      return module;
    });
    return promise;
  });
  
  // Preload the component if needed
  useEffect(() => {
    if (preload) {
      const timer = setTimeout(() => {
        // Trigger the import
        importFunction();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [importFunction, preload, delay]);
  
  return { LazyComponent, isLoaded };
}

/**
 * Preloads a component
 * @param {Function} importFunction - The import function for the component
 * @returns {Promise} - The import promise
 */
export const preloadComponent = (importFunction) => {
  return importFunction();
};
