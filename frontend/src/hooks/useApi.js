import { useState, useCallback } from 'react';

/**
 * Custom hook for making API calls with loading and error states
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Options for the hook
 * @param {boolean} options.loadingInitial - Initial loading state
 * @param {Function} options.onSuccess - Callback for successful API calls
 * @param {Function} options.onError - Callback for failed API calls
 * @returns {Object} - The hook state and functions
 */
export default function useApi(apiFunction, options = {}) {
  const { loadingInitial = false, onSuccess, onError } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(loadingInitial);
  const [error, setError] = useState(null);
  
  /**
   * Execute the API call
   * @param {any} params - Parameters to pass to the API function
   * @returns {Promise} - The API response
   */
  const execute = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction(params);
      setData(response.data);
      setLoading(false);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      
      if (onError) {
        onError(errorMessage, err);
      }
      
      throw err;
    }
  }, [apiFunction, onSuccess, onError]);
  
  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);
  
  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
