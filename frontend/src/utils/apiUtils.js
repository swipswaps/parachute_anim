import axios from 'axios';
import errorHandler from './errorHandler';

/**
 * Create an API request with retry logic
 * 
 * @param {Function} apiCall - The API call function
 * @param {Object} options - Options for the request
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.retryDelay - Delay between retries in milliseconds
 * @param {Function} options.onRetry - Callback when a retry occurs
 * @param {Array<number>} options.retryStatusCodes - HTTP status codes to retry on
 * @returns {Promise} - The API response
 */
export async function withRetry(
  apiCall,
  {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry = null,
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
  } = {}
) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry =
        attempt < maxRetries &&
        (axios.isCancel(error) ||
          !error.response ||
          retryStatusCodes.includes(error.response?.status));
      
      if (!shouldRetry) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry({
          error,
          attempt,
          maxRetries,
          delay,
        });
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Create a debounced function
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @param {boolean} immediate - Whether to call the function immediately
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Create a throttled function
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function executedFunction(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      
      lastFunc = setTimeout(function() {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Create a cached API call
 * 
 * @param {Function} apiCall - The API call function
 * @param {Object} options - Options for the cache
 * @param {number} options.maxAge - Maximum age of the cache in milliseconds
 * @param {Function} options.keyGenerator - Function to generate a cache key
 * @returns {Function} - The cached API call function
 */
export function createCachedApiCall(
  apiCall,
  {
    maxAge = 5 * 60 * 1000, // 5 minutes
    keyGenerator = (...args) => JSON.stringify(args),
  } = {}
) {
  const cache = new Map();
  
  return async function cachedApiCall(...args) {
    const key = keyGenerator(...args);
    const cachedItem = cache.get(key);
    
    if (cachedItem && Date.now() - cachedItem.timestamp < maxAge) {
      return cachedItem.data;
    }
    
    try {
      const data = await apiCall(...args);
      
      cache.set(key, {
        data,
        timestamp: Date.now(),
      });
      
      return data;
    } catch (error) {
      // Log the error
      errorHandler.handleApiError(error, {
        apiCall: apiCall.name || 'unknown',
        args,
      });
      
      throw error;
    }
  };
}

/**
 * Create an abortable API call
 * 
 * @param {Function} apiCall - The API call function
 * @returns {Object} - The abortable API call
 */
export function createAbortableApiCall(apiCall) {
  let controller = new AbortController();
  
  const execute = async (...args) => {
    try {
      return await apiCall(...args, { signal: controller.signal });
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
      } else {
        throw error;
      }
    }
  };
  
  const abort = () => {
    controller.abort();
    controller = new AbortController();
  };
  
  return {
    execute,
    abort,
  };
}
