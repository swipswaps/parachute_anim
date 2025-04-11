/**
 * Utilities for handling API rate limits
 */

/**
 * Exponential backoff retry with jitter
 * 
 * @param {Function} fn - The function to retry
 * @param {Object} options - Options for retry
 * @param {number} options.maxRetries - Maximum number of retries (default: 5)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 60000)
 * @param {Function} options.shouldRetry - Function to determine if retry should happen (default: retry on rate limit errors)
 * @param {Function} options.onRetry - Callback on retry (default: console log)
 * @returns {Promise<any>} - Result of the function
 */
export async function withRetry(
  fn,
  {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 60000,
    shouldRetry = (error) => {
      // Retry on rate limit errors (429) or server errors (5xx)
      return (
        error.status === 429 ||
        (error.status >= 500 && error.status < 600) ||
        // Network errors don't have status
        !error.status
      );
    },
    onRetry = (error, attempt, delay) => {
      console.warn(
        `API call failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
        error
      );
    },
  } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= maxRetries || !shouldRetry(error)) {
        break;
      }

      // Calculate delay with exponential backoff and jitter
      // Formula: min(maxDelay, baseDelay * 2^attempt + random jitter)
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000; // Add up to 1s of jitter
      const delay = Math.min(maxDelay, exponentialDelay + jitter);

      // If GitHub API provides a Retry-After header, use that instead
      if (error.response?.headers?.['retry-after']) {
        const retryAfter = parseInt(error.response.headers['retry-after'], 10);
        if (!isNaN(retryAfter)) {
          // Convert seconds to milliseconds
          const retryAfterMs = retryAfter * 1000;
          // Use the greater of our calculated delay or the API's suggested delay
          delay = Math.max(delay, retryAfterMs);
        }
      }

      // Call onRetry callback
      onRetry(error, attempt + 1, delay);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if an error is due to rate limiting
 * 
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is due to rate limiting
 */
export function isRateLimitError(error) {
  return error.status === 429 || 
    (error.message && error.message.includes('rate limit'));
}

/**
 * Extract rate limit information from GitHub API response
 * 
 * @param {Object} response - The GitHub API response
 * @returns {Object|null} - Rate limit information or null if not available
 */
export function extractRateLimitInfo(response) {
  if (!response || !response.headers) {
    return null;
  }

  const headers = response.headers;
  
  return {
    limit: parseInt(headers['x-ratelimit-limit'], 10) || null,
    remaining: parseInt(headers['x-ratelimit-remaining'], 10) || null,
    reset: parseInt(headers['x-ratelimit-reset'], 10) || null,
    resetDate: headers['x-ratelimit-reset'] 
      ? new Date(parseInt(headers['x-ratelimit-reset'], 10) * 1000) 
      : null,
    used: parseInt(headers['x-ratelimit-used'], 10) || null,
    resource: headers['x-ratelimit-resource'] || null,
  };
}

/**
 * Format rate limit information for display
 * 
 * @param {Object} rateLimitInfo - Rate limit information
 * @returns {string} - Formatted rate limit information
 */
export function formatRateLimitInfo(rateLimitInfo) {
  if (!rateLimitInfo) {
    return 'Rate limit information not available';
  }

  const { remaining, limit, resetDate } = rateLimitInfo;
  
  if (remaining === null || limit === null || !resetDate) {
    return 'Partial rate limit information available';
  }

  const resetIn = Math.max(0, Math.ceil((resetDate - new Date()) / 1000 / 60));
  
  return `${remaining}/${limit} requests remaining. Resets in ${resetIn} minutes.`;
}
